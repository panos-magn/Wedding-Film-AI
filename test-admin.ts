import { getDbAdmin } from "./server/services/dbAdmin";
async function run() {
  try {
    const db = getDbAdmin();
    console.log("DB instance retrieved");
    const snap = await db.collection("users").limit(1).get();
    console.log("Projects empty:", snap.empty);
  } catch (err) {
    console.error("FAILED:", err);
  }
}
run();
