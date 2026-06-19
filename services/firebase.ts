import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Project, UserProfile, AIResult } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore DB
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */

// Test Firestore connection on boot as mandated by the SKILL.md
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

// Define Error Handling Interfaces and Operations as mandated by the SKILL.md
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ---------------------- Profile Services ----------------------

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      return userSnapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Create profile if not exist helper
export async function ensureUserProfileOrCreateDefault(firebaseUser: FirebaseUser): Promise<UserProfile> {
  const existing = await getUserProfile(firebaseUser.uid);
  if (existing) {
    // If the email is the user's primary email, ensure they have the 'admin' role if not already set
    if (firebaseUser.email === 'tzampasyndromi@gmail.com' && existing.role !== 'admin') {
      const updated = { ...existing, role: 'admin' as const };
      await saveUserProfile(firebaseUser.uid, updated);
      return updated;
    }
    return existing;
  }
  
  const isCreatorAdmin = firebaseUser.email === 'tzampasyndromi@gmail.com';
  const defaultProfile: UserProfile = {
    fullName: firebaseUser.displayName || 'Καινούριος Χρήστης',
    businessName: 'My Motion Picture Studio',
    email: firebaseUser.email || '',
    phone: '',
    website: '',
    address: '',
    brandColors: { primary: '#6366f1', secondary: '#a855f7', accent: '#ec4899' },
    contractTemplate: 'Το προεπιλεγμένο κείμενο συμβολαίου βιντεοσκόπησης γάμου πηγαίνει εδώ...',
    role: isCreatorAdmin ? 'admin' : 'user',
    subscriptionStatus: isCreatorAdmin ? 'active' : 'trialing',
    subscriptionExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionPlan: isCreatorAdmin ? 'pro' : 'free_trial',
    aiCreditsUsed: 0,
    lastCreditsResetMonth: '',
    stripeCustomerId: ''
  };
  await saveUserProfile(firebaseUser.uid, defaultProfile);
  return defaultProfile;
}

// ---------------------- Admin Services ----------------------

export async function getAllUsers(): Promise<(UserProfile & { id: string })[]> {
  const path = 'users';
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const result: (UserProfile & { id: string })[] = [];
    snapshot.forEach((d) => {
      result.push({
        ...d.data(),
        id: d.id,
      } as UserProfile & { id: string });
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminUpdateUserProfile(userId: string, fields: Partial<UserProfile>): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, fields);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------------- Project Services ----------------------

export async function getProjectsForUser(userId: string): Promise<Project[]> {
  const path = 'projects';
  try {
    const projectsCol = collection(db, 'projects');
    const q = query(projectsCol, where('ownerId', '==', userId));
    const snapshot = await getDocs(q);
    const result: Project[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      result.push({
        ...data,
        id: d.id, // Use doc ID as project ID
      } as Project);
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addProjectForUser(userId: string, project: Omit<Project, 'ownerId'>): Promise<string> {
  const projectId = project.id || doc(collection(db, 'projects')).id;
  const path = `projects/${projectId}`;
  try {
    const projectRef = doc(db, 'projects', projectId);
    const savedProject = {
      ...project,
      id: projectId,
      ownerId: userId,
      createdAt: project.createdAt || new Date().toISOString()
    };
    await setDoc(projectRef, savedProject);
    return projectId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateProjectForUser(userId: string, project: Project): Promise<void> {
  const path = `projects/${project.id}`;
  try {
    const projectRef = doc(db, 'projects', project.id);
    const payload = {
      ...project,
      ownerId: userId // Ensure ownerId remains loggedIn user's uid
    };
    await setDoc(projectRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProjectForUser(projectId: string): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------- Google Authentication Popup ----------------------

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error: ', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error: ', error);
    throw error;
  }
}

// ---------------------- AI Results Services ----------------------

export async function getAIResultsForUser(userId: string): Promise<AIResult[]> {
  const path = 'ai_results';
  try {
    const aiResultsCol = collection(db, 'ai_results');
    const q = query(aiResultsCol, where('ownerId', '==', userId));
    const snapshot = await getDocs(q);
    const result: AIResult[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      result.push({
        id: d.id,
        projectId: data.projectId,
        moduleType: data.moduleType,
        title: data.title || '',
        content: data.content || '',
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addAIResultForUser(userId: string, result: AIResult): Promise<string> {
  const resultId = result.id || doc(collection(db, 'ai_results')).id;
  const path = `ai_results/${resultId}`;
  try {
    const resultRef = doc(db, 'ai_results', resultId);
    const savedResult = {
      projectId: result.projectId,
      moduleType: result.moduleType,
      title: result.title,
      content: result.content,
      ownerId: userId,
      createdAt: result.createdAt || new Date().toISOString()
    };
    await setDoc(resultRef, savedResult);
    return resultId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAIResultForUser(resultId: string): Promise<void> {
  const path = `ai_results/${resultId}`;
  try {
    const resultRef = doc(db, 'ai_results', resultId);
    await deleteDoc(resultRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

