import fs from "fs";
import path from "path";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let dbAdminInstance: any = null;

export const getDbAdmin = () => {
  if (!dbAdminInstance) {
    try {
      const adminDocPath = path.join(process.cwd(), "firebase-applet-config.json");
      let projectId = "";
      let databaseId = "";
      if (fs.existsSync(adminDocPath)) {
        const config = JSON.parse(fs.readFileSync(adminDocPath, "utf8"));
        projectId = config.projectId;
        databaseId = config.firestoreDatabaseId;
      }

      if (!projectId) {
        projectId = process.env.GOOGLE_CLOUD_PROJECT || "profound-dragon-r8gvj";
      }

      if (!getApps().length) {
        initializeApp({
          projectId: projectId,
        });
      }

      if (databaseId) {
        try {
          dbAdminInstance = getFirestore(getApp(), databaseId);
        } catch (altErr) {
          console.warn("[Firebase Admin] Failed using explicit database ID, using default.", altErr);
          dbAdminInstance = getFirestore();
        }
      } else {
        dbAdminInstance = getFirestore();
      }
    } catch (err) {
      console.error("[Firebase Admin] Critical error initializing Admin SDK:", err);
      throw err;
    }
  }
  return dbAdminInstance;
};
