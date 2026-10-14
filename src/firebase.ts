import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDocs,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'config'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is operating in offline mode or waiting for connection.');
    }
    return false;
  }
}

// Clean helper to sanitize IDs for Firestore keys
export function sanitizeDocId(rawId: string): string {
  if (!rawId) return 'DOC_' + Date.now();
  return String(rawId).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
}

// Helper to save a single document into Firestore with error handling
export async function saveFirestoreDoc(collPath: string, docId: string, data: any): Promise<void> {
  const safeId = sanitizeDocId(docId);
  const targetPath = `${collPath}/${safeId}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, collPath, safeId), cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, targetPath);
  }
}

// Helper to delete a document from Firestore
export async function deleteFirestoreDoc(collPath: string, docId: string): Promise<void> {
  const safeId = sanitizeDocId(docId);
  const targetPath = `${collPath}/${safeId}`;
  try {
    await deleteDoc(doc(db, collPath, safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, targetPath);
  }
}

// Helper to sync array collection into Firestore in batch
export async function syncCollectionToFirestore<T extends { id: string }>(collPath: string, items: T[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      if (!item || !item.id) continue;
      const safeId = sanitizeDocId(item.id);
      const cleanData = JSON.parse(JSON.stringify(item));
      batch.set(doc(db, collPath, safeId), cleanData, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collPath);
  }
}

// Helper to listen to a collection in real-time
export function subscribeFirestoreCollection<T>(
  collPath: string,
  onData: (data: T[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, collPath),
      (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as unknown as T));
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collPath);
  }
}

// Seed Firestore once on first boot if collections are empty
export async function seedFirestoreIfEmpty(data: {
  students?: any[];
  teachers?: any[];
  violations?: any[];
  rewards?: any[];
  compensations?: any[];
  piketSchedules?: any[];
  violationRules?: any[];
  rewardRules?: any[];
  settings?: any;
}): Promise<void> {
  try {
    const studentSnap = await getDocs(collection(db, 'students'));
    if (studentSnap.empty && data.students && data.students.length > 0) {
      console.log('🌱 Seeding initial students to Firestore...');
      await syncCollectionToFirestore('students', data.students);
    }

    const teacherSnap = await getDocs(collection(db, 'teachers'));
    if (teacherSnap.empty && data.teachers && data.teachers.length > 0) {
      console.log('🌱 Seeding initial teachers to Firestore...');
      await syncCollectionToFirestore('teachers', data.teachers);
    }

    const violSnap = await getDocs(collection(db, 'violations'));
    if (violSnap.empty && data.violations && data.violations.length > 0) {
      console.log('🌱 Seeding initial violations to Firestore...');
      await syncCollectionToFirestore('violations', data.violations);
    }

    const rewSnap = await getDocs(collection(db, 'rewards'));
    if (rewSnap.empty && data.rewards && data.rewards.length > 0) {
      console.log('🌱 Seeding initial rewards to Firestore...');
      await syncCollectionToFirestore('rewards', data.rewards);
    }

    const piketSnap = await getDocs(collection(db, 'piketSchedules'));
    if (piketSnap.empty && data.piketSchedules && data.piketSchedules.length > 0) {
      await syncCollectionToFirestore('piketSchedules', data.piketSchedules);
    }

    const rulesSnap = await getDocs(collection(db, 'violationRules'));
    if (rulesSnap.empty && data.violationRules && data.violationRules.length > 0) {
      await syncCollectionToFirestore('violationRules', data.violationRules);
    }

    const rewardRulesSnap = await getDocs(collection(db, 'rewardRules'));
    if (rewardRulesSnap.empty && data.rewardRules && data.rewardRules.length > 0) {
      await syncCollectionToFirestore('rewardRules', data.rewardRules);
    }

    if (data.settings) {
      await saveFirestoreDoc('settings', 'config', data.settings);
    }
  } catch (error) {
    console.warn('Seeding check completed or skipped:', error);
  }
}
