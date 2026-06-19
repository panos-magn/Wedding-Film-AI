import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function run() {
  try {
    if (!getApps().length) initializeApp();
    const db = getFirestore();
    const snap = await db.collection("users").limit(1).get();
    console.log("Empty:", snap.empty);
  } catch (e) {
    console.error("FAIL:", e);
  }
}
run();
