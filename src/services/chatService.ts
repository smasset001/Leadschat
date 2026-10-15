import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Conversation, Message, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export async function getOrCreateDirectConversation(
  currentUser: { uid: string; displayName?: string; photoURL?: string },
  targetUser: { uid: string; displayName: string; photoURL?: string; businessName?: string }
): Promise<string> {
  const convId = [currentUser.uid, targetUser.uid].sort().join('_');
  const convRef = doc(db, 'conversations', convId);

  try {
    const existing = await getDoc(convRef);
    if (!existing.exists()) {
      const newConversation: Conversation = {
        id: convId,
        type: 'direct',
        participantIds: [currentUser.uid, targetUser.uid],
        participantDetails: {
          [currentUser.uid]: {
            displayName: currentUser.displayName || 'You',
            photoURL: currentUser.photoURL,
          },
          [targetUser.uid]: {
            displayName: targetUser.displayName || 'Affiliate',
            photoURL: targetUser.photoURL,
            businessName: targetUser.businessName,
          },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(convRef, newConversation);
    }
    return convId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `conversations/${convId}`);
  }
}

export async function createGroupConversation(
  ownerId: string,
  ownerProfile: UserProfile,
  groupName: string,
  groupDescription: string,
  memberIds: string[]
): Promise<string> {
  const allParticipantIds = Array.from(new Set([ownerId, ...memberIds]));
  const convRef = doc(collection(db, 'conversations'));

  const details: Record<string, { displayName: string; photoURL?: string }> = {
    [ownerId]: {
      displayName: ownerProfile.displayName,
      photoURL: ownerProfile.photoURL,
    },
  };

  const newGroup: Conversation = {
    id: convRef.id,
    type: 'group',
    groupName,
    groupDescription,
    groupOwnerId: ownerId,
    participantIds: allParticipantIds,
    participantDetails: details,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(convRef, newGroup);
    return convRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `conversations/${convRef.id}`);
  }
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (trimmed.length > 4000) {
    throw new Error('Message length exceeds maximum 4,000 characters limit.');
  }

  const messagesCol = collection(db, 'conversations', conversationId, 'messages');
  const convRef = doc(db, 'conversations', conversationId);
  const now = new Date().toISOString();

  try {
    const newMsg: Omit<Message, 'id'> = {
      senderId,
      senderName,
      text: trimmed,
      createdAt: now,
    };
    await addDoc(messagesCol, newMsg);

    await updateDoc(convRef, {
      lastMessage: trimmed,
      lastMessageSenderId: senderId,
      lastMessageAt: now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `conversations/${conversationId}/messages`);
  }
}

export function listenToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const convs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];
      // Sort by lastMessageAt or updatedAt desc
      convs.sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || a.updatedAt || 0).getTime();
        const timeB = new Date(b.lastMessageAt || b.updatedAt || 0).getTime();
        return timeB - timeA;
      });
      callback(convs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'conversations');
    }
  );
}

export function listenToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      callback(msgs);
    },
    (err) => {
      handleFirestoreError(
        err,
        OperationType.LIST,
        `conversations/${conversationId}/messages`
      );
    }
  );
}
