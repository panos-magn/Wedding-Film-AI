import { useState, useEffect } from "react";
import { Project } from "../../types";
import {
  getProjectsForUser,
  addProjectForUser,
  updateProjectForUser,
  deleteProjectForUser,
} from "../../services/firebase";
import { User as FirebaseUser } from "firebase/auth";

export const useProjects = (firebaseUser: FirebaseUser | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unmounted = false;
    if (firebaseUser) {
      setLoading(true);
      getProjectsForUser(firebaseUser.uid)
        .then((data) => {
          if (!unmounted) setProjects(data);
        })
        .finally(() => {
          if (!unmounted) setLoading(false);
        });
    } else {
      setProjects([]);
      setLoading(false);
    }
    return () => {
      unmounted = true;
    };
  }, [firebaseUser]);

  const addProject = async (p: Project) => {
    if (firebaseUser) {
      await addProjectForUser(firebaseUser.uid, p);
      setProjects((prev) => [...prev, p]);
    }
  };

  const updateProject = async (p: Project) => {
    if (firebaseUser) {
      await updateProjectForUser(firebaseUser.uid, p);
      setProjects((prev) => prev.map((proj) => (proj.id === p.id ? p : proj)));
    }
  };

  const deleteProject = async (id: string) => {
    await deleteProjectForUser(id);
    setProjects((prev) => prev.filter((p) => !p.id.includes(id)));
  };

  return { projects, loading, addProject, updateProject, deleteProject };
};
