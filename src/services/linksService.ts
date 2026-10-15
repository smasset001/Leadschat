import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  updateDoc,
  increment,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatLink, LinkEvent, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export async function resolveChatLink(slug: string): Promise<{
  link?: ChatLink;
  ownerProfile: UserProfile;
} | null> {
  const cleanSlug = slug.trim().toLowerCase();
  try {
    // 1. First look up custom campaign link
    const linkQuery = query(collection(db, 'chatLinks'), where('slug', '==', cleanSlug), limit(1));
    const linkSnap = await getDocs(linkQuery);

    let foundLink: ChatLink | undefined;
    let targetOwnerId: string | undefined;

    if (!linkSnap.empty) {
      const docData = linkSnap.docs[0];
      foundLink = { id: docData.id, ...docData.data() } as ChatLink;
      if (!foundLink.isActive) {
        return null; // Link deactivated
      }
      targetOwnerId = foundLink.userId;
    } else {
      // 2. Look up user by customChatSlug or direct uid
      const userQuery = query(collection(db, 'users'), where('customChatSlug', '==', cleanSlug), limit(1));
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty) {
        targetOwnerId = userSnap.docs[0].id;
      } else {
        // Test direct uid match
        const directUserDoc = await getDoc(doc(db, 'users', cleanSlug));
        if (directUserDoc.exists()) {
          targetOwnerId = directUserDoc.id;
        }
      }
    }

    if (!targetOwnerId) return null;

    // Fetch the target owner's public business profile
    const ownerDoc = await getDoc(doc(db, 'users', targetOwnerId));
    if (!ownerDoc.exists()) return null;

    return {
      link: foundLink,
      ownerProfile: { uid: ownerDoc.id, ...ownerDoc.data() } as UserProfile,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'chatLinks');
  }
}

export async function recordLinkClick(
  linkId: string,
  affiliateId: string,
  source = 'Direct',
  campaign = 'General'
) {
  try {
    await addDoc(collection(db, 'linkEvents'), {
      linkId,
      affiliateId,
      eventType: 'click',
      source,
      campaign,
      createdAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, 'chatLinks', linkId), {
      clicks: increment(1),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Non-blocking for visitor analytics
    console.warn('Analytics click tracking note:', error);
  }
}

export async function recordChatStart(linkId: string, affiliateId: string) {
  try {
    await addDoc(collection(db, 'linkEvents'), {
      linkId,
      affiliateId,
      eventType: 'chat_start',
      createdAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, 'chatLinks', linkId), {
      chatsStarted: increment(1),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Analytics chat start tracking note:', error);
  }
}

export async function createChatLink(
  userId: string,
  params: {
    slug: string;
    linkName: string;
    campaignName?: string;
    source?: string;
    destinationType?: 'direct_chat' | 'business_profile';
  }
): Promise<string> {
  const cleanSlug = params.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (cleanSlug.length < 3) {
    throw new Error('Slug must be at least 3 characters long.');
  }

  // Check unique slug
  const existingQuery = query(collection(db, 'chatLinks'), where('slug', '==', cleanSlug));
  const existingDocs = await getDocs(existingQuery);
  if (!existingDocs.empty) {
    throw new Error('This link slug is already taken. Please choose another.');
  }

  const linkRef = doc(collection(db, 'chatLinks'));
  const newLink: ChatLink = {
    id: linkRef.id,
    userId,
    slug: cleanSlug,
    linkName: params.linkName.trim(),
    campaignName: params.campaignName?.trim() || 'General',
    source: params.source?.trim() || 'Organic',
    destinationType: params.destinationType || 'direct_chat',
    isActive: true,
    clicks: 0,
    signups: 0,
    chatsStarted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(linkRef, newLink);
    return linkRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `chatLinks/${linkRef.id}`);
  }
}

export async function getUserLinks(userId: string): Promise<ChatLink[]> {
  try {
    const q = query(collection(db, 'chatLinks'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const links = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatLink));
    links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return links;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'chatLinks');
  }
}

export async function toggleChatLinkStatus(linkId: string, isActive: boolean) {
  try {
    await updateDoc(doc(db, 'chatLinks', linkId), {
      isActive,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chatLinks/${linkId}`);
  }
}

export async function getAffiliateAnalytics(affiliateId: string) {
  try {
    const eventsQuery = query(
      collection(db, 'linkEvents'),
      where('affiliateId', '==', affiliateId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(eventsQuery);
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LinkEvent));

    const totalClicks = events.filter((e) => e.eventType === 'click').length;
    const totalSignups = events.filter((e) => e.eventType === 'signup').length;
    const totalChats = events.filter((e) => e.eventType === 'chat_start').length;

    const sourceMap: Record<string, number> = {};
    events.forEach((e) => {
      const src = e.source || 'Organic';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });

    const signupConversionRate = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : '0';
    const chatConversionRate = totalClicks > 0 ? ((totalChats / totalClicks) * 100).toFixed(1) : '0';

    return {
      events,
      totalClicks,
      totalSignups,
      totalChats,
      sourceMap,
      signupConversionRate,
      chatConversionRate,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'linkEvents');
  }
}
