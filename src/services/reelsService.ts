import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Reel } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export function normalizeVideoEmbed(url: string): { embedUrl: string; thumbnailUrl?: string } {
  const trimmed = url.trim();

  // YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
  const ytShortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (ytShortsMatch && ytShortsMatch[1]) {
    const videoId = ytShortsMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playsinline=1&rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // YouTube standard or share link: https://youtu.be/VIDEO_ID or youtube.com/watch?v=VIDEO_ID
  const ytWatchMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/);
  if (ytWatchMatch && ytWatchMatch[1]) {
    const videoId = ytWatchMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playsinline=1&rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1&loop=1`,
    };
  }

  // Fallback direct or standard URL
  return {
    embedUrl: trimmed,
  };
}

const DEFAULT_REELS: Omit<Reel, 'id'>[] = [
  {
    title: 'How Top Affiliates Generate 100+ Leads Weekly',
    description: 'Breakdown of campaign funnels, personal chat link optimization, and closing scripts for modern sales reps.',
    category: 'Sales Strategy',
    videoUrl: 'https://www.youtube.com/shorts/kJQP7kiw5Fk',
    embedUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk?autoplay=1&loop=1&playsinline=1&rel=0',
    thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    isFeatured: true,
    isPublished: true,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Customer Follow-Up Framework That Converts',
    description: 'Never let a lead go cold. The 3-touch cadence that turns not reachable into interested clients.',
    category: 'CRM Mastery',
    videoUrl: 'https://www.youtube.com/shorts/fJ9rUzIMcZQ',
    embedUrl: 'https://www.youtube.com/embed/fJ9rUzIMcZQ?autoplay=1&loop=1&playsinline=1&rel=0',
    thumbnailUrl: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    isFeatured: true,
    isPublished: true,
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Affiliate Testimonial: From Zero to ₹2,50,000 In 60 Days',
    description: 'Real affiliate journey using the Leads Bank allocation system and personal WhatsApp-style campaign tracking.',
    category: 'Testimonials',
    videoUrl: 'https://www.youtube.com/shorts/3JZ_D3ELwOQ',
    embedUrl: 'https://www.youtube.com/embed/3JZ_D3ELwOQ?autoplay=1&loop=1&playsinline=1&rel=0',
    thumbnailUrl: 'https://img.youtube.com/vi/3JZ_D3ELwOQ/hqdefault.jpg',
    isFeatured: false,
    isPublished: true,
    order: 3,
    createdAt: new Date().toISOString(),
  },
];

export async function getPublishedReels(): Promise<Reel[]> {
  try {
    const q = query(collection(db, 'reels'), where('isPublished', '==', true));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Seed default curated reels
      const seeded: Reel[] = [];
      for (const r of DEFAULT_REELS) {
        const ref = doc(collection(db, 'reels'));
        const reel: Reel = { id: ref.id, ...r };
        await setDoc(ref, reel);
        seeded.push(reel);
      }
      return seeded;
    }

    const reels = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reel));
    reels.sort((a, b) => (a.order || 0) - (b.order || 0));
    return reels;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reels');
  }
}

export async function getAllReelsAdmin(): Promise<Reel[]> {
  try {
    const snap = await getDocs(collection(db, 'reels'));
    const reels = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reel));
    reels.sort((a, b) => (a.order || 0) - (b.order || 0));
    return reels;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reels');
  }
}

export async function createReel(
  adminUid: string,
  adminEmail: string,
  params: {
    title: string;
    description: string;
    category: string;
    videoUrl: string;
    isFeatured: boolean;
    isPublished: boolean;
    order: number;
  }
): Promise<string> {
  const normalized = normalizeVideoEmbed(params.videoUrl);
  const reelRef = doc(collection(db, 'reels'));
  const now = new Date().toISOString();

  const newReel: Reel = {
    id: reelRef.id,
    title: params.title.trim(),
    description: params.description.trim(),
    category: params.category.trim() || 'Business',
    videoUrl: params.videoUrl.trim(),
    embedUrl: normalized.embedUrl,
    thumbnailUrl: normalized.thumbnailUrl,
    isFeatured: params.isFeatured,
    isPublished: params.isPublished,
    order: params.order || 1,
    createdAt: now,
  };

  try {
    await setDoc(reelRef, newReel);

    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: 'CREATE_REEL',
      targetEntity: 'reels',
      targetId: reelRef.id,
      details: `Created reel: ${newReel.title}`,
      createdAt: now,
    });

    return reelRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reels/${reelRef.id}`);
  }
}

export async function updateReel(
  adminUid: string,
  adminEmail: string,
  reelId: string,
  updates: Partial<Reel>
) {
  try {
    const payload: Partial<Reel> = { ...updates };
    if (updates.videoUrl) {
      const normalized = normalizeVideoEmbed(updates.videoUrl);
      payload.embedUrl = normalized.embedUrl;
      if (normalized.thumbnailUrl) {
        payload.thumbnailUrl = normalized.thumbnailUrl;
      }
    }
    await updateDoc(doc(db, 'reels', reelId), payload);

    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: 'UPDATE_REEL',
      targetEntity: 'reels',
      targetId: reelId,
      details: `Updated reel attributes`,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reels/${reelId}`);
  }
}

export async function deleteReel(adminUid: string, adminEmail: string, reelId: string) {
  try {
    await deleteDoc(doc(db, 'reels', reelId));

    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: 'DELETE_REEL',
      targetEntity: 'reels',
      targetId: reelId,
      details: `Deleted reel ${reelId}`,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reels/${reelId}`);
  }
}
