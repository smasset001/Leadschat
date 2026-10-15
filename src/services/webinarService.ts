import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Webinar, Announcement } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

const DEFAULT_WEBINARS: Omit<Webinar, 'id'>[] = [
  {
    title: 'Weekly Affiliate Masterclass: Scaling to ₹50k/Week',
    description: 'Live interactive workshop reviewing real sales funnels, high-converting WhatsApp scripts, and lead bank distribution strategies.',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: 'Asia/Kolkata (IST)',
    joinUrl: 'https://meet.google.com/new',
    isCancelled: false,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Lead Follow-Up Bootcamp: Closing Cold Prospects',
    description: 'Master the art of calling leads, handling initial objections, and scheduling structured second-touch appointments.',
    scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: 'Asia/Kolkata (IST)',
    joinUrl: 'https://zoom.us',
    isCancelled: false,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ANNOUNCEMENTS: Omit<Announcement, 'id'>[] = [
  {
    title: 'Lead Bank Allocation Update: 5,000 Verified B2B Leads Added',
    content: 'Our data sourcing team has enriched the Lead Bank with 5,000 fresh verified leads across metropolitan business sectors. Affiliates can submit purchase requests directly from the Lead Bank tab.',
    priority: 'high',
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'New Feature: Campaign Tracking Links with Source Attribution',
    content: 'Pro affiliates can now create separate tracking links for Meta Ads, YouTube descriptions, and direct outreach to monitor conversions in real-time.',
    priority: 'normal',
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
];

export async function getWebinars(): Promise<Webinar[]> {
  try {
    const snap = await getDocs(collection(db, 'webinars'));
    if (snap.empty) {
      const seeded: Webinar[] = [];
      for (const w of DEFAULT_WEBINARS) {
        const ref = doc(collection(db, 'webinars'));
        const item: Webinar = { id: ref.id, ...w };
        await setDoc(ref, item);
        seeded.push(item);
      }
      return seeded;
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Webinar));
    list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'webinars');
  }
}

export async function createWebinar(
  adminUid: string,
  adminEmail: string,
  params: {
    title: string;
    description: string;
    scheduledAt: string;
    timezone: string;
    joinUrl: string;
  }
): Promise<string> {
  const ref = doc(collection(db, 'webinars'));
  const now = new Date().toISOString();
  const webinar: Webinar = {
    id: ref.id,
    title: params.title.trim(),
    description: params.description.trim(),
    scheduledAt: params.scheduledAt,
    timezone: params.timezone || 'IST',
    joinUrl: params.joinUrl.trim(),
    isCancelled: false,
    isPublished: true,
    createdAt: now,
  };

  try {
    await setDoc(ref, webinar);
    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: 'CREATE_WEBINAR',
      targetEntity: 'webinars',
      targetId: ref.id,
      details: `Created webinar: ${webinar.title}`,
      createdAt: now,
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `webinars/${ref.id}`);
  }
}

export async function toggleWebinarCancel(adminUid: string, adminEmail: string, webinarId: string, isCancelled: boolean) {
  try {
    await updateDoc(doc(db, 'webinars', webinarId), { isCancelled });
    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: isCancelled ? 'CANCEL_WEBINAR' : 'RESTORE_WEBINAR',
      targetEntity: 'webinars',
      targetId: webinarId,
      details: `Updated cancellation state`,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `webinars/${webinarId}`);
  }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snap = await getDocs(collection(db, 'announcements'));
    if (snap.empty) {
      const seeded: Announcement[] = [];
      for (const a of DEFAULT_ANNOUNCEMENTS) {
        const ref = doc(collection(db, 'announcements'));
        const item: Announcement = { id: ref.id, ...a };
        await setDoc(ref, item);
        seeded.push(item);
      }
      return seeded;
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'announcements');
  }
}

export async function createAnnouncement(
  adminUid: string,
  adminEmail: string,
  params: {
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high';
  }
): Promise<string> {
  const ref = doc(collection(db, 'announcements'));
  const now = new Date().toISOString();
  const ann: Announcement = {
    id: ref.id,
    title: params.title.trim(),
    content: params.content.trim(),
    priority: params.priority,
    isPublished: true,
    createdAt: now,
  };

  try {
    await setDoc(ref, ann);
    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: 'CREATE_ANNOUNCEMENT',
      targetEntity: 'announcements',
      targetId: ref.id,
      details: `Created announcement: ${ann.title}`,
      createdAt: now,
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `announcements/${ref.id}`);
  }
}
