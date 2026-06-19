import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Trash2,
  Clock,
  ChevronRight,
  UserX,
  RefreshCw,
  UserPlus2,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { UserProfile } from "../types";
import { getAllUsers, adminUpdateUserProfile } from "../services/firebase";

interface AdminDashboardProps {
  onBackToApp: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  currentUserId: string;
}

interface UserWithId extends UserProfile {
  id: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToApp,
  showToast,
  currentUserId,
}) => {
  const [users, setUsers] = React.useState<UserWithId[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedUser, setSelectedUser] = React.useState<UserWithId | null>(
    null,
  );

  // Local edit states
  const [editRole, setEditRole] = React.useState<"user" | "admin">("user");
  const [editStatus, setEditStatus] = React.useState<
    "active" | "trialing" | "past_due" | "canceled" | "none"
  >("none");
  const [editExpires, setEditExpires] = React.useState<string>("");
  const [updating, setUpdating] = React.useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      if (allUsers) {
        setUsers(allUsers as UserWithId[]);
      }
    } catch (err) {
      console.error(err);
      showToast("Σφάλμα κατά την ανάκτηση των χρηστών.", "error");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (user: UserWithId) => {
    setSelectedUser(user);
    setEditRole(user.role || "user");
    setEditStatus(user.subscriptionStatus || "none");

    // Parse expiry date to split YYYY-MM-DD
    if (user.subscriptionExpiresAt) {
      setEditExpires(user.subscriptionExpiresAt.split("T")[0]);
    } else {
      setEditExpires("");
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      const expirationIso = editExpires
        ? new Date(editExpires).toISOString()
        : "";
      const payload: Partial<UserProfile> = {
        role: editRole,
        subscriptionStatus: editStatus,
        subscriptionExpiresAt: expirationIso,
      };

      await adminUpdateUserProfile(selectedUser.id, payload);

      showToast(
        `Ο χρήστης ${selectedUser.fullName} ενημερώθηκε επιτυχώς!`,
        "success",
      );

      // Update local list
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, ...payload } : u)),
      );
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      showToast("Αποτυχία ενημέρωσης χρήστη.", "error");
    } finally {
      setUpdating(false);
    }
  };

  // Metrics
  const totalUsersCount = users.length;
  const activeSubsCount = users.filter(
    (u) => u.subscriptionStatus === "active",
  ).length;
  const trialingUsersCount = users.filter(
    (u) => u.subscriptionStatus === "trialing",
  ).length;
  const adminsCount = users.filter((u) => u.role === "admin").length;

  // Filter list
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.businessName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-[2rem] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Συνολικοί Χρήστες
            </p>
            <h4 className="text-2xl font-bold text-slate-50 mt-1">
              {loading ? "..." : totalUsersCount}
            </h4>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/60 rounded-[2rem] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Ενεργές Συνδρομές
            </p>
            <h4 className="text-2xl font-bold text-slate-50 mt-1">
              {loading ? "..." : activeSubsCount}
            </h4>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/60 rounded-[2rem] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Σε Δοκιμαστική Περίοδο
            </p>
            <h4 className="text-2xl font-bold text-slate-50 mt-1">
              {loading ? "..." : trialingUsersCount}
            </h4>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/60 rounded-[2rem] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Διαχειριστές (Admins)
            </p>
            <h4 className="text-2xl font-bold text-slate-50 mt-1">
              {loading ? "..." : adminsCount}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Admin Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: User list & management */}
        <div className="lg:col-span-7 bg-slate-900/30 border border-slate-800/60 rounded-[2.5rem] p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-50">
                Διαλογισμός Συνδρομητών
              </h3>
              <p className="text-slate-400 text-xs">
                Δείτε ποιοι χρήστες βρίσκονται στην πλατφόρμα και ελέγξτε τις
                άδειες πρόσβασης.
              </p>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchUsers}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-slate-400 hover:text-slate-50 transition-all flex items-center justify-center self-start"
            >
              <RefreshCw
                size={16}
                className={`${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Αναζήτηση με όνομα, email, ή επωνυμία..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800/60 rounded-2xl py-4 pl-12 pr-6 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                Ανάκτηση συνδρομητών...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center bg-slate-950/20 border border-dashed border-slate-800/60 rounded-3xl">
              <UserX className="mx-auto text-slate-550 mb-3" size={32} />
              <p className="text-sm font-bold text-slate-400">
                Δεν βρέθηκαν χρήστες
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Δοκιμάστε άλλον όρο αναζήτησης.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const isMe = currentUserId === user.id;

                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500/40 shadow-lg"
                        : "bg-slate-950/30 border-slate-800/60 hover:border-slate-700/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                        {user.fullName ? user.fullName.charAt(0) : "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-50 truncate">
                            {user.fullName || "Χωρίς Όνομα"}
                          </p>
                          {user.role === "admin" && (
                            <span className="text-[8px] font-bold tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md uppercase">
                              Admin
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[8px] font-bold tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md uppercase">
                              Εσείς
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Subscription status pill */}
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          user.subscriptionStatus === "active"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : user.subscriptionStatus === "trialing"
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-slate-900 border-slate-800 text-slate-500"
                        }`}
                      >
                        {user.subscriptionStatus || "none"}
                      </span>
                      <ChevronRight size={16} className="text-slate-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Subscriber Management Controls */}
        <div className="lg:col-span-5 space-y-6">
          {selectedUser ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-6 md:p-8 space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-50">
                  Επεξεργασία Χρήστη
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Αλλαγή δικαιωμάτων & συνδρομητικής κατάστασης.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                  {selectedUser.fullName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-50 truncate">
                    {selectedUser.fullName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Role */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Ρόλος Συστήματος
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditRole("user")}
                      className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                        editRole === "user"
                          ? "bg-slate-950 border-indigo-500/50 text-indigo-400 shadow-md"
                          : "bg-slate-950/20 border-slate-800/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRole("admin")}
                      className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                        editRole === "admin"
                          ? "bg-slate-950 border-purple-500/50 text-purple-400 shadow-md"
                          : "bg-slate-950/20 border-slate-800/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {/* Subscription Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Κατάσταση Συνδρομής
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        "active",
                        "trialing",
                        "past_due",
                        "canceled",
                        "none",
                      ] as const
                    ).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditStatus(st)}
                        className={`py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all truncate ${
                          editStatus === st
                            ? "bg-indigo-500/10 border-indigo-500/45 text-indigo-400"
                            : "bg-slate-950/20 border-slate-800/60 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Ημερομηνία Λήξης
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={16}
                    />
                    <input
                      type="date"
                      value={editExpires}
                      onChange={(e) => setEditExpires(e.target.value)}
                      className="w-full bg-slate-955/40 border border-slate-800/60 rounded-xl py-3 pl-12 pr-6 text-xs text-slate-200 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <p className="text-[9px] text-slate-600 font-medium italic italic ml-1">
                    Αφήστε κενό εάν δεν υπάρχει ημερομηνία λήξης.
                  </p>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-3 px-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-755 font-bold text-xs text-slate-400 tracking-wider uppercase"
                >
                  Ακυρωση
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleUpdate}
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 font-bold text-xs text-white tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Αποθηκευση"
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-900/20 border border-dashed border-slate-800/60 rounded-[2.5rem] p-8 text-center min-h-[380px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-500/50 mb-4 animate-pulse">
                <Users size={28} />
              </div>
              <p className="text-sm font-bold text-slate-400">
                Επιλέξτε έναν Συνδρομητή
              </p>
              <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Κάντε κλικ σε οποιονδήποτε χρήστη για να δείτε τα πλήρη στοιχεία
                του, να αλλάξετε το ρόλο του ή να τροποποιήσετε χειροκίνητα τη
                συνδρομή του.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
