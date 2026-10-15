import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile as updateFirebaseAuthProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserPrivate } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  userPrivate: UserPrivate | null;
  isAdmin: boolean;
  isPro: boolean;
  loading: boolean;
  signup: (fullName: string, mobile: string, email: string, pass: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOTSTRAP_ADMIN_EMAIL = 'smasset001@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPrivate, setUserPrivate] = useState<UserPrivate | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Bootstrap admin record if current user is the administrator email
        if (user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
          try {
            await setDoc(
              doc(db, 'admins', user.uid),
              { email: user.email, grantedAt: new Date().toISOString() },
              { merge: true }
            );
          } catch (e) {
            console.error('Admin bootstrap record update notice:', e);
          }
        }

        // Listen to public user profile
        const unsubProfile = onSnapshot(
          doc(db, 'users', user.uid),
          (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data() as UserProfile);
            } else {
              // Create default profile if not exists
              const isSuper = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
              const defaultProfile: UserProfile = {
                uid: user.uid,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || undefined,
                role: isSuper ? 'admin' : 'free',
                isPro: isSuper,
                createdAt: new Date().toISOString(),
              };
              setDoc(doc(db, 'users', user.uid), defaultProfile, { merge: true }).catch(() => {});
              setUserProfile(defaultProfile);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }
        );

        // Listen to private profile
        const unsubPrivate = onSnapshot(
          doc(db, 'userPrivate', user.uid),
          (snapshot) => {
            if (snapshot.exists()) {
              setUserPrivate(snapshot.data() as UserPrivate);
            } else {
              const defaultPrivate: UserPrivate = {
                uid: user.uid,
                email: user.email || '',
                approvedEntitlement: 0,
                leadBalance: 0,
                leadsDelivered: 0,
                subscriptionStatus: 'free',
                createdAt: new Date().toISOString(),
              };
              setDoc(doc(db, 'userPrivate', user.uid), defaultPrivate, { merge: true }).catch(() => {});
              setUserPrivate(defaultPrivate);
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, `userPrivate/${user.uid}`);
          }
        );

        setLoading(false);
        return () => {
          unsubProfile();
          unsubPrivate();
        };
      } else {
        setUserProfile(null);
        setUserPrivate(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (fullName: string, mobile: string, email: string, pass: string) => {
    const cleanMobile = mobile.replace(/[^0-9+]/g, '');
    const mobileKey = `phone_${cleanMobile.replace(/\+/g, 'plus')}`;

    // Concurrency-safe phone number uniqueness check
    try {
      const phoneDoc = await getDoc(doc(db, 'phoneRegistry', mobileKey));
      if (phoneDoc.exists()) {
        throw new Error('This mobile number is already registered to another account.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('already registered')) {
        throw err;
      }
    }

    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;
    const isSuper = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    await updateFirebaseAuthProfile(cred.user, {
      displayName: fullName.trim(),
    });

    // Write phone registry mapping
    await setDoc(doc(db, 'phoneRegistry', mobileKey), {
      phone: cleanMobile,
      userId: uid,
      createdAt: new Date().toISOString(),
    });

    // Write public profile
    const profileData: UserProfile = {
      uid,
      displayName: fullName.trim(),
      role: isSuper ? 'admin' : 'free',
      isPro: isSuper,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', uid), profileData);

    // Write private profile
    const privateData: UserPrivate = {
      uid,
      email,
      mobileNumber: cleanMobile,
      approvedEntitlement: 0,
      leadBalance: 0,
      leadsDelivered: 0,
      subscriptionStatus: isSuper ? 'pro_active' : 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'userPrivate', uid), privateData);

    if (isSuper) {
      await setDoc(doc(db, 'admins', uid), {
        email,
        grantedAt: new Date().toISOString(),
      });
    }

    // Process attribution if a campaign/chat link was recorded in localStorage
    try {
      const attributionStr = localStorage.getItem('leads_chat_pending_attribution');
      if (attributionStr) {
        const attribution = JSON.parse(attributionStr);
        if (attribution.linkId && attribution.affiliateId) {
          // Log signup event
          await addDoc(collection(db, 'linkEvents'), {
            linkId: attribution.linkId,
            affiliateId: attribution.affiliateId,
            eventType: 'signup',
            campaign: attribution.campaign || 'Direct',
            source: attribution.source || 'Organic',
            createdAt: new Date().toISOString(),
          });
          // Increment link signups count
          await updateDoc(doc(db, 'chatLinks', attribution.linkId), {
            signups: increment(1),
          });
        }
      }
    } catch (err) {
      console.warn('Failed to record attribution event:', err);
    }
  };

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;
    const isSuper = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    // Check if public profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const profileData: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || undefined,
        role: isSuper ? 'admin' : 'free',
        isPro: isSuper,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), profileData);

      const privateData: UserPrivate = {
        uid: user.uid,
        email: user.email || '',
        approvedEntitlement: 0,
        leadBalance: 0,
        leadsDelivered: 0,
        subscriptionStatus: isSuper ? 'pro_active' : 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'userPrivate', user.uid), privateData);

      if (isSuper) {
        await setDoc(doc(db, 'admins', user.uid), {
          email: user.email,
          grantedAt: new Date().toISOString(),
        });
      }

      try {
        const attributionStr = localStorage.getItem('leads_chat_pending_attribution');
        if (attributionStr) {
          const attribution = JSON.parse(attributionStr);
          if (attribution.linkId && attribution.affiliateId) {
            await addDoc(collection(db, 'linkEvents'), {
              linkId: attribution.linkId,
              affiliateId: attribution.affiliateId,
              eventType: 'signup',
              campaign: attribution.campaign || 'Direct',
              source: attribution.source || 'Organic',
              createdAt: new Date().toISOString(),
            });
            await updateDoc(doc(db, 'chatLinks', attribution.linkId), {
              signups: increment(1),
            });
          }
        }
      } catch (err) {
        console.warn('Attribution recording note:', err);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('Not authenticated');
    const updatePayload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'users', currentUser.uid), updatePayload);
    if (data.displayName) {
      await updateFirebaseAuthProfile(currentUser, { displayName: data.displayName });
    }
  };

  const isAdmin =
    currentUser?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
    userProfile?.role === 'admin';

  const isPro =
    isAdmin ||
    userProfile?.role === 'pro' ||
    userProfile?.isPro === true ||
    userPrivate?.subscriptionStatus === 'pro_active';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        userPrivate,
        isAdmin,
        isPro,
        loading,
        signup,
        login,
        signInWithGoogle,
        logout,
        resetPassword,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
