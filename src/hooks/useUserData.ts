import { useState, useEffect } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import {
  auth,
  ensureUserProfileOrCreateDefault,
  getProjectsForUser,
  getAIResultsForUser,
  saveUserProfile,
  addProjectForUser,
  updateProjectForUser,
  deleteProjectForUser,
  addAIResultForUser,
  deleteAIResultForUser,
} from "../../services/firebase";
import { Project, AIResult, UserProfile } from "../../types";

export const useUserData = (
  showToast: (msg: string, type?: "success" | "error") => void,
  setGlobalLoading: (loading: boolean) => void,
) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [aiResults, setAiResults] = useState<AIResult[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    brandColors: {
      primary: "#6366f1",
      secondary: "#a855f7",
      accent: "#ec4899",
    },
    contractTemplate: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthChecking(true);
      if (user) {
        try {
          const profile = await ensureUserProfileOrCreateDefault(user);
          setUserProfile(profile);

          const fetchedProjects = await getProjectsForUser(user.uid);
          setProjects(fetchedProjects);

          const fetchedResults = await getAIResultsForUser(user.uid);
          setAiResults(fetchedResults);

          setFirebaseUser(user);
        } catch (error) {
          console.error("Error setting up user session: ", error);
          showToast("Σφάλμα κατά την προετοιμασία των δεδομένων σας.", "error");
        }
      } else {
        setFirebaseUser(null);
        setProjects([]);
        setAiResults([]);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [showToast]);

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    if (!firebaseUser) return;
    setGlobalLoading(true);
    try {
      await saveUserProfile(firebaseUser.uid, updatedProfile);
      setUserProfile(updatedProfile);
      showToast("Οι ρυθμίσεις αποθηκεύτηκαν!");
    } catch (error) {
      showToast("Αποτυχία αποθήκευσης ρυθμίσεων.", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAddProject = async (p: Project) => {
    if (!firebaseUser) return;
    setGlobalLoading(true);
    try {
      const generatedId = await addProjectForUser(firebaseUser.uid, p);
      const newProj = { ...p, id: generatedId };
      setProjects((prev) => [...prev, newProj]);
      showToast("Το έργο προστέθηκε επιτυχώς!");
    } catch (error) {
      showToast("Αποτυχία προσθήκης έργου.", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleUpdateProject = async (updated: Project) => {
    if (!firebaseUser) return;
    setGlobalLoading(true);
    try {
      await updateProjectForUser(firebaseUser.uid, updated);
      setProjects((prev) =>
        prev.map((pro) => (pro.id === updated.id ? updated : pro)),
      );
      showToast("Το έργο ενημερώθηκε!");
    } catch (error) {
      showToast("Αποτυχία ενημέρωσης έργου.", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, callback?: () => void) => {
    if (!firebaseUser) return;
    setGlobalLoading(true);
    try {
      await deleteProjectForUser(id);
      setProjects((prev) => prev.filter((pro) => pro.id !== id));
      showToast("Το έργο διαγράφηκε επιτυχώς.");
      if (callback) callback();
    } catch (error) {
      showToast("Αποτυχία διαγραφής έργου.", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleSaveAIResult = async (result: AIResult) => {
    if (!firebaseUser) return;
    try {
      const generatedId = await addAIResultForUser(firebaseUser.uid, result);
      const newResult = { ...result, id: generatedId };
      setAiResults((prev) => [newResult, ...prev]);
    } catch (error) {
      console.error("Error saving AI result:", error);
      throw error;
    }
  };

  const handleDeleteAIResult = async (id: string) => {
    if (!firebaseUser) return;
    try {
      await deleteAIResultForUser(id);
      setAiResults((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting AI result:", error);
      showToast("Αποτυχία διαγραφής AI αποτελέσματος.", "error");
    }
  };

  return {
    firebaseUser,
    authChecking,
    projects,
    aiResults,
    userProfile,
    setUserProfile, // Sometimes needed for direct local optimistic updates
    handleUpdateProfile,
    handleAddProject,
    handleUpdateProject,
    handleDeleteProject,
    handleSaveAIResult,
    handleDeleteAIResult,
  };
};
