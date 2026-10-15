import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  addDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  UserProfile,
  UserPrivate,
  AdminAuditLog,
  ApplicationSettings,
  ChatLink,
  LeadPurchaseRequest,
} from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

const DEFAULT_SETTINGS: ApplicationSettings = {
  proMonthlyINR: 99,
  proYearlyINR: 999,
  manualPaymentInstructions:
    'Transfer via UPI to: leadschat@upi (or scan business QR code). Include your registered email address in the transaction notes. Verification completes within 1-2 hours.',
  supportEmail: 'support@leadschat.io',
  leadPriceDefaultINR: 15,
};

export async function getApplicationSettings(): Promise<ApplicationSettings> {
  try {
    const docRef = doc(db, 'applicationSettings', 'global');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() });
      return DEFAULT_SETTINGS;
    }
    return snap.data() as ApplicationSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'applicationSettings/global');
  }
}

export async function updateApplicationSettings(
  adminUid: string,
  adminEmail: string,
  settings: Partial<ApplicationSettings>
) {
  try {
    const docRef = doc(db, 'applicationSettings', 'global');
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });

    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: 'UPDATE_APP_SETTINGS',
      targetEntity: 'applicationSettings',
      targetId: 'global',
      details: 'Updated global pricing or payment configurations',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'applicationSettings/global');
  }
}

export async function getAllUsersAdmin(): Promise<
  Array<UserProfile & { email?: string; mobile?: string; leadBalance?: number; subscriptionStatus?: string }>
> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const privSnap = await getDocs(collection(db, 'userPrivate'));

    const privMap: Record<string, UserPrivate> = {};
    privSnap.docs.forEach((d) => {
      privMap[d.id] = d.data() as UserPrivate;
    });

    return usersSnap.docs.map((d) => {
      const u = d.data() as UserProfile;
      const priv = privMap[u.uid];
      return {
        ...u,
        email: priv?.email,
        mobile: priv?.mobileNumber,
        leadBalance: priv?.leadBalance || 0,
        subscriptionStatus: priv?.subscriptionStatus || 'free',
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

export async function adminUpdateUserRole(
  adminUid: string,
  adminEmail: string,
  targetUserId: string,
  targetEmail: string,
  role: 'free' | 'pro' | 'admin',
  isPro: boolean
) {
  try {
    const now = new Date().toISOString();

    // Update public profile
    await updateDoc(doc(db, 'users', targetUserId), {
      role,
      isPro,
      updatedAt: now,
    });

    // Update private profile
    await updateDoc(doc(db, 'userPrivate', targetUserId), {
      subscriptionStatus: isPro ? 'pro_active' : 'free',
      updatedAt: now,
    });

    // If role is admin, write to /admins/{targetUserId}
    if (role === 'admin') {
      await setDoc(
        doc(db, 'admins', targetUserId),
        { email: targetEmail, grantedAt: now },
        { merge: true }
      );
    }

    // Audit log
    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: 'UPDATE_USER_ROLE',
      targetEntity: 'users',
      targetId: targetUserId,
      details: `Changed role to ${role} (isPro: ${isPro})`,
      createdAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
  }
}

export async function getAdminAuditLogs(limitCount = 50): Promise<AdminAuditLog[]> {
  try {
    const q = query(
      collection(db, 'adminAuditLogs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminAuditLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'adminAuditLogs');
  }
}

export async function getAdminPlatformMetrics() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const requestsSnap = await getDocs(collection(db, 'leadPurchaseRequests'));
    const inventorySnap = await getDocs(collection(db, 'leadInventory'));
    const assignmentsSnap = await getDocs(collection(db, 'leadAssignments'));
    const linksSnap = await getDocs(collection(db, 'chatLinks'));

    const users = usersSnap.docs.map((d) => d.data() as UserProfile);
    const requests = requestsSnap.docs.map((d) => d.data() as LeadPurchaseRequest);
    const inventory = inventorySnap.docs.map((d) => d.data());
    const links = linksSnap.docs.map((d) => d.data() as ChatLink);

    const totalUsers = users.length;
    const proUsers = users.filter((u) => u.isPro || u.role === 'pro' || u.role === 'admin').length;
    const pendingRequests = requests.filter((r) => r.status === 'pending').length;
    const availableLeads = inventory.filter((i) => i.status === 'available').length;
    const assignedLeads = assignmentsSnap.docs.length;
    const totalClicks = links.reduce((acc, l) => acc + (l.clicks || 0), 0);
    const totalSignups = links.reduce((acc, l) => acc + (l.signups || 0), 0);

    return {
      totalUsers,
      proUsers,
      pendingRequests,
      availableLeads,
      assignedLeads,
      totalClicks,
      totalSignups,
      totalLinks: links.length,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'adminMetrics');
  }
}
