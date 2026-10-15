import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InAppNotification } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export function listenToNotifications(
  userId: string,
  callback: (notifications: InAppNotification[]) => void
) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as InAppNotification[];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    }
  );
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function requestWebPushPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted' ? 'granted' : 'denied';
  } catch (err) {
    console.warn('Web push request failed:', err);
    return 'denied';
  }
}
