import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp, getDocFromServer, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Account, Trade, Strategy } from './types';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error handling for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Database wrapper
export const database = {
  accounts: {
    async list(userId: string): Promise<Account[]> {
      try {
        const q = query(collection(db, 'accounts'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'accounts');
        return [];
      }
    },
    subscribe(userId: string, callback: (payload: any) => void) {
      const q = query(collection(db, 'accounts'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          callback({
            eventType: change.type.toUpperCase(),
            new: { id: change.doc.id, ...change.doc.data() },
            old: { id: change.doc.id }
          });
        });
      }, (error) => handleFirestoreError(error, OperationType.GET, 'accounts'));
    },
    async add(data: any) {
      console.log('Firestore: Adding to accounts', data);
      try {
        const docRef = await addDoc(collection(db, 'accounts'), { ...data, createdAt: serverTimestamp() });
        console.log('Firestore: Added account with ID', docRef.id);
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Firestore: Error adding account', error);
        handleFirestoreError(error, OperationType.CREATE, 'accounts');
      }
    },
    async update(id: string, data: any) {
      try {
        await updateDoc(doc(db, 'accounts', id), data);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `accounts/${id}`);
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'accounts', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `accounts/${id}`);
      }
    }
  },
  trades: {
    async list(userId: string): Promise<Trade[]> {
      try {
        const q = query(collection(db, 'trades'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'trades');
        return [];
      }
    },
    subscribe(userId: string, callback: (payload: any) => void) {
      const q = query(collection(db, 'trades'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          callback({
            eventType: change.type.toUpperCase(),
            new: { id: change.doc.id, ...change.doc.data() },
            old: { id: change.doc.id }
          });
        });
      }, (error) => handleFirestoreError(error, OperationType.GET, 'trades'));
    },
    async add(data: any) {
      console.log('Firestore: Adding to trades', data);
      try {
        const docRef = await addDoc(collection(db, 'trades'), { ...data, createdAt: serverTimestamp() });
        console.log('Firestore: Added trade with ID', docRef.id);
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Firestore: Error adding trade', error);
        handleFirestoreError(error, OperationType.CREATE, 'trades');
      }
    },
    async update(id: string, data: any) {
      try {
        await updateDoc(doc(db, 'trades', id), data);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `trades/${id}`);
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'trades', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `trades/${id}`);
      }
    },
    async clear(userId: string) {
      try {
        const q = query(collection(db, 'trades'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const batch = snapshot.docs.map(d => deleteDoc(doc(db, 'trades', d.id)));
        await Promise.all(batch);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'trades/clear');
      }
    }
  },
  strategies: {
    async list(userId: string): Promise<Strategy[]> {
      try {
        const q = query(collection(db, 'strategies'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Strategy));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'strategies');
        return [];
      }
    },
    subscribe(userId: string, callback: (payload: any) => void) {
      const q = query(collection(db, 'strategies'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          callback({
            eventType: change.type.toUpperCase(),
            new: { id: change.doc.id, ...change.doc.data() },
            old: { id: change.doc.id }
          });
        });
      }, (error) => handleFirestoreError(error, OperationType.GET, 'strategies'));
    },
    async add(data: any) {
      console.log('Firestore: Adding to strategies', data);
      try {
        const docRef = await addDoc(collection(db, 'strategies'), { ...data, createdAt: serverTimestamp() });
        console.log('Firestore: Added strategy with ID', docRef.id);
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Firestore: Error adding strategy', error);
        handleFirestoreError(error, OperationType.CREATE, 'strategies');
      }
    },
    async update(id: string, data: any) {
      try {
        await updateDoc(doc(db, 'strategies', id), data);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `strategies/${id}`);
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'strategies', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `strategies/${id}`);
      }
    }
  }
};

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  serverTimestamp
};
export type { User };
