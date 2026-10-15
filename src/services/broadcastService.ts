import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Broadcast, Conversation } from '../types';
import { sendMessage, getOrCreateDirectConversation } from './chatService';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export async function createAndSendBroadcast(
  affiliateId: string,
  affiliateName: string,
  broadcastName: string,
  messageText: string,
  targetRecipientUserIds: string[]
): Promise<Broadcast> {
  const cleanName = broadcastName.trim();
  const cleanMsg = messageText.trim();
  if (!cleanName) throw new Error('Broadcast name is required');
  if (!cleanMsg) throw new Error('Message text cannot be empty');
  if (targetRecipientUserIds.length === 0) throw new Error('At least one recipient must be selected');

  const ref = doc(collection(db, 'broadcasts'));
  const now = new Date().toISOString();

  const record: Broadcast = {
    id: ref.id,
    affiliateId,
    name: cleanName,
    messageText: cleanMsg,
    recipientCount: targetRecipientUserIds.length,
    status: 'sent',
    recipientIds: targetRecipientUserIds,
    createdAt: now,
  };

  try {
    await setDoc(ref, record);

    // Send to each recipient's direct conversation thread
    for (const recipientId of targetRecipientUserIds) {
      try {
        const convId = await getOrCreateDirectConversation(
          { uid: affiliateId, displayName: affiliateName },
          { uid: recipientId, displayName: 'Client' }
        );
        await sendMessage(convId, affiliateId, affiliateName, `[Broadcast] ${cleanMsg}`);
      } catch (sendErr) {
        console.warn(`Failed to deliver broadcast to ${recipientId}:`, sendErr);
      }
    }

    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `broadcasts/${ref.id}`);
  }
}

export async function getAffiliateBroadcasts(affiliateId: string): Promise<Broadcast[]> {
  try {
    const q = query(
      collection(db, 'broadcasts'),
      where('affiliateId', '==', affiliateId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Broadcast));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'broadcasts');
  }
}
