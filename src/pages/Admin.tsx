import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getData, getSettings, adminLogin, 
  deleteTeamMember, deleteEvent, deleteGalleryItem, deleteProject, deleteJoinRequest, deleteContact,
  addTeamMember, createEvent, createGalleryItem, createProject,
  updateTeamMember, updateEvent, updateGalleryItem, updateProject,
  getTasks, createTask, updateTask, deleteTask,
  updateSettings, replyToContact, scheduleInterview, decideApplicant,
  approvePending, rejectPending, getNotifications, clearNotifications
} from "@/lib/api";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // General Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formState, setFormState] = useState<any>({});

  // Specific Action Modals
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyContactId, setReplyContactId] = useState("");
  const [replyText, setReplyText] = useState("");

  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewJoinId, setInterviewJoinId] = useState("");
  const [interviewDetails, setInterviewDetails] = useState({ meetLink: "", dateTime: "", note: "" });

  useEffect(() => {
    const savedToken = localStorage.getItem("mss_admin_token");
    if (savedToken) {
      setToken(savedToken);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [resData, resSettings, resNotifs] = await Promise.all([
        getData().catch(() => ({ data: {} })),
        getSettings().catch(() => ({ data: {} })),
        getNotifications().catch(() => ({ data: [] }))
      ]);
      setData(resData.data);
      setSettings(resSettings.data || {});
      setNotifications(Array.isArray(resNotifs.data) ? resNotifs.data : (resNotifs.data?.notifications || []));
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
    setDataLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await adminLogin(email, password);
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        localStorage.setItem("mss_admin_token", res.data.token);
        fetchData();
      } else {
        setError(res.data.error || "Invalid credentials");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("mss_admin_token");
  };

  const handleDelete = async (category: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      if (category === "team") await deleteTeamMember(id);
      else if (category === "events") await deleteEvent(id);
      else if (category === "gallery") await deleteGalleryItem(id);
      else if (category === "projects") await deleteProject(id);
      else if (category === "join") await deleteJoinRequest(id);
      else if (category === "contact") await deleteContact(id);
      else if (category === "tasks") await deleteTask(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete item");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingItem;
    let submitData = { ...formState };
    if (activeTab === "projects" && typeof submitData.techStack === "string") {
      submitData.techStack = submitData.techStack.split(",").map((s: string) => s.trim());
    }

    try {
      if (isEdit) {
        if (activeTab === "team") await updateTeamMember(editingItem.id, submitData);
        else if (activeTab === "events") await updateEvent(editingItem.id, submitData);
        else if (activeTab === "gallery") await updateGalleryItem(editingItem.id, submitData);
        else if (activeTab === "projects") await updateProject(editingItem.id, submitData);
        else if (activeTab === "tasks") await updateTask(editingItem.id, submitData);
      } else {
        if (activeTab === "team") await addTeamMember(submitData);
        else if (activeTab === "events") await createEvent(submitData);
        else if (activeTab === "gallery") await createGalleryItem(submitData);
        else if (activeTab === "projects") await createProject(submitData);
        else if (activeTab === "tasks") await createTask(submitData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save item");
    }
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await replyToContact(replyContactId, replyText);
      setReplyModalOpen(false);
      alert("Reply logged successfully.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to reply");
    }
  };

  const submitInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleInterview(interviewJoinId, interviewDetails);
      setInterviewModalOpen(false);
      alert("Interview scheduled successfully.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to schedule interview");
    }
  };

  const handleDecide = async (id: string, decision: 'selected' | 'rejected') => {
    if (!confirm(`Are you sure you want to mark this applicant as ${decision.toUpperCase()}?`)) return;
    try {
      await decideApplicant(id, decision);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed decision");
    }
  };

  const handlePending = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this pending member?`)) return;
    try {
      if (action === 'approve') await approvePending(id);
      else await rejectPending(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed action on pending member");
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(settings);
      alert("Settings saved successfully!");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    }
  };

  const handleClearNotifs = async () => {
    if (!confirm("Clear all notifications?")) return;
    try {
      await clearNotifications();
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to clear notifications");
    }
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      let formVals = { ...item };
      if (activeTab === "projects" && Array.isArray(formVals.techStack)) {
        formVals.techStack = formVals.techStack.join(", ");
      }
      setFormState(formVals);
    } else {
      setEditingItem(null);
      setFormState({});
    }
    setIsModalOpen(true);
  };

  const openReplyModal = (id: string) => {
    setReplyContactId(id);
    setReplyText("");
    setReplyModalOpen(true);
  };

  const openInterviewModal = (id: string) => {
    setInterviewJoinId(id);
    setInterviewDetails({ meetLink: "", dateTime: "", note: "" });
    setInterviewModalOpen(true);
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-[#050816] text-white pt-24 pb-12 px-6 relative overflow-hidden flex items-center justify-center font-['Outfit']">
        {/* Background glow effects */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white/[0.02] backdrop-blur-2xl p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            
            <div className="text-center mb-8">
              <motion.h1 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
              >
                Admin Portal
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-blue-400/80 uppercase tracking-widest text-xs font-semibold"
              >
                Restricted Access Only
              </motion.p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center border border-red-500/20">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div whileTap={{ scale: 0.99 }}>
                <label className="block mb-2 text-sm font-medium text-gray-300">Admin Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
                  placeholder="admin@mssuemk.com"
                />
              </motion.div>
              <motion.div whileTap={{ scale: 0.99 }}>
                <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
                  placeholder="••••••••"
                />
              </motion.div>
              <motion.button 
                type="submit" 
                disabled={loading} 
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full py-3.5 mt-2 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                  loading ? "bg-blue-600/50 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Authenticating...
                  </>
                ) : "Login to Dashboard"}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </main>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Overview & Dashboard", icon: "📊" },
    { id: "join", label: "Recruitment Apps", icon: "📝" },
    { id: "pendingMembers", label: "Pending Signups", icon: "⏳" },
    { id: "tasks", label: "Manage Tasks", icon: "✅" },
    { id: "team", label: "Team Directory", icon: "👥" },
    { id: "events", label: "Events & Workshops", icon: "🎪" },
    { id: "projects", label: "Projects Portfolio", icon: "🚀" },
    { id: "gallery", label: "Photo Gallery", icon: "📸" },
    { id: "contact", label: "Visitor Messages", icon: "✉️" },
    { id: "settings", label: "Global Settings", icon: "⚙️" },
  ];

  return (
    <main className="min-h-screen bg-[#02040a] text-white flex font-['Outfit'] relative overflow-hidden pt-24">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-72 bg-[#050812]/80 backdrop-blur-xl border-r border-white/[0.05] flex flex-col z-20 shrink-0 h-[calc(100vh-6rem)] sticky top-24"
      >
        <div className="p-8 border-b border-white/[0.05]">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">MSS Admin</h2>
          <p className="text-sm text-gray-500 font-medium tracking-wide mt-1 uppercase">Command Center</p>
        </div>
        <div className="flex flex-col p-4 gap-1 overflow-y-auto flex-1 custom-scrollbar">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-medium ${
                activeTab === tab.id 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]" 
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-white border border-transparent"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-white/[0.05]">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm border border-red-500/20 hover:bg-red-500/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Secure Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <section className="flex-1 h-[calc(100vh-6rem)] overflow-y-auto p-6 md:p-12 relative z-10 custom-scrollbar">
        {dataLoading && !data ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-blue-400 font-medium tracking-widest uppercase text-sm animate-pulse">Syncing Data Layer...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  {tabs.find(t => t.id === activeTab)?.icon} 
                  {tabs.find(t => t.id === activeTab)?.label}
                </h1>
                <p className="text-gray-400 text-sm">Manage your portal resources and view system analytics.</p>
              </div>
              
              {["team", "events", "gallery", "projects", "tasks"].includes(activeTab) && (
                <button 
                  onClick={() => openModal()} 
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add New Entity
                </button>
              )}
            </header>

            {/* Dashboard Overview */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                      { label: "Active Members", value: data?.team?.length || 0, color: "text-purple-400", bg: "from-purple-500/10 to-transparent", border: "border-purple-500/20", icon: "👥" },
                      { label: "Pending Signups", value: data?.pendingMembers?.length || 0, color: "text-red-400", bg: "from-red-500/10 to-transparent", border: "border-red-500/20", icon: "⏳" },
                      { label: "Recruitment Apps", value: data?.joinRequests?.length || 0, color: "text-amber-400", bg: "from-amber-500/10 to-transparent", border: "border-amber-500/20", icon: "📝" },
                      { label: "Public Tasks", value: data?.tasks?.length || 0, color: "text-blue-400", bg: "from-blue-500/10 to-transparent", border: "border-blue-500/20", icon: "✅" },
                      { label: "Total Portfolio", value: (data?.gallery?.length || 0) + (data?.projects?.length || 0), color: "text-emerald-400", bg: "from-emerald-500/10 to-transparent", border: "border-emerald-500/20", icon: "🚀" },
                      { label: "Visitor Messages", value: data?.contactMessages?.length || 0, color: "text-pink-400", bg: "from-pink-500/10 to-transparent", border: "border-pink-500/20", icon: "✉️" },
                    ].map((stat, i) => (
                      <motion.div 
                        key={stat.label} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} p-6 rounded-2xl border ${stat.border} backdrop-blur-sm group hover:border-white/20 transition-all`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest z-10 relative">{stat.label}</h3>
                          <span className="text-2xl opacity-50 grayscale group-hover:grayscale-0 transition-all">{stat.icon}</span>
                        </div>
                        <div className={`text-4xl font-black ${stat.color} z-10 relative`}>{stat.value}</div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/[0.02] rounded-full blur-xl pointer-events-none group-hover:bg-white/[0.04] transition-all" />
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Notifications Timeline */}
                <div className="xl:col-span-1 bg-[#050812]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col h-[600px]">
                  <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Activity Log
                    </h3>
                    <button onClick={handleClearNotifs} className="text-red-400 hover:text-red-300 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">Clear Log</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full opacity-30">
                        <span className="text-4xl mb-2">📭</span>
                        <p className="text-sm text-center">System logs are empty.</p>
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={n.id || n._id} 
                          className="relative pl-6 pb-4 last:pb-0 border-l-2 border-white/5 last:border-transparent"
                        >
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-[#050812]" />
                          <p className="text-sm text-gray-200 mb-1 leading-relaxed">{n.message}</p>
                          <span className="text-xs text-gray-500 font-medium">{new Date(n.createdAt).toLocaleString()}</span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* General Tables */}
            {["team", "events", "gallery", "projects", "tasks"].includes(activeTab) && (
              <div className="bg-[#050812]/50 border border-white/[0.05] rounded-2xl overflow-x-auto backdrop-blur-md">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Entity Identifier</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Secondary Attributes</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.[activeTab] || []).length === 0 ? (
                      <tr><td colSpan={3} className="p-8 text-center text-gray-500 italic">No records found.</td></tr>
                    ) : (
                      (data?.[activeTab] || []).map((item: any) => (
                        <tr key={item.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                          <td className="p-5 font-semibold text-white">{item.name || item.title}</td>
                          <td className="p-5 text-sm text-gray-400">{item.email || item.date || item.category || item.status || "---"}</td>
                          <td className="p-5 text-right space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(item)} className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">Edit</button>
                            <button onClick={() => handleDelete(activeTab, item.id)} className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pending Members Table */}
            {activeTab === "pendingMembers" && (
              <div className="bg-[#050812]/50 border border-white/[0.05] rounded-2xl overflow-x-auto backdrop-blur-md">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Applicant Name</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Profile Meta</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Decision Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.pendingMembers || []).length === 0 ? (
                       <tr><td colSpan={3} className="p-8 text-center text-gray-500 italic">No pending signups.</td></tr>
                    ) : (
                      (data?.pendingMembers || []).map((item: any) => (
                        <tr key={item.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                          <td className="p-5 font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">
                              {item.name.charAt(0)}
                            </div>
                            {item.name}
                          </td>
                          <td className="p-5 text-sm">
                            <div className="text-gray-300">{item.email}</div>
                            <div className="text-xs text-purple-400 font-medium mt-1">{item.title} — {item.category}</div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handlePending(item.id, 'approve')} className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-sm font-bold transition-colors">Approve</button>
                              <button onClick={() => handlePending(item.id, 'reject')} className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors">Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Join Requests Table */}
            {activeTab === "join" && (
              <div className="bg-[#050812]/50 border border-white/[0.05] rounded-2xl overflow-x-auto backdrop-blur-md">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Candidate Info</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Current Status</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Pipeline Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.joinRequests || []).length === 0 ? (
                       <tr><td colSpan={3} className="p-8 text-center text-gray-500 italic">No applications found.</td></tr>
                    ) : (
                      (data?.joinRequests || []).map((item: any) => (
                        <tr key={item.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                          <td className="p-5">
                            <div className="font-bold text-white text-base mb-1">{item.name}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                              <span className="text-gray-300">{item.email}</span> &bull; <span className="text-blue-400 font-medium">{item.domain}</span>
                            </div>
                            <div className="text-xs text-gray-500">Year {item.year} &bull; {item.department}</div>
                          </td>
                          <td className="p-5">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                              item.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                              item.status === 'interview_scheduled' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                              item.status === 'selected' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                              "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              {item.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex justify-end gap-2 items-center">
                              {item.status === 'pending' && <button onClick={() => openInterviewModal(item.id)} className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg text-sm font-bold transition-colors">Schedule Interview</button>}
                              {item.status === 'interview_scheduled' && (
                                <>
                                  <button onClick={() => handleDecide(item.id, 'selected')} className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-sm font-bold transition-colors">Select</button>
                                  <button onClick={() => handleDecide(item.id, 'rejected')} className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors">Reject</button>
                                </>
                              )}
                              <button onClick={() => handleDelete("join", item.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors ml-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Contact Messages Table */}
            {activeTab === "contact" && (
              <div className="bg-[#050812]/50 border border-white/[0.05] rounded-2xl overflow-x-auto backdrop-blur-md">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/4">Visitor Details</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Message Thread</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.contactMessages || []).length === 0 ? (
                       <tr><td colSpan={3} className="p-8 text-center text-gray-500 italic">No messages found.</td></tr>
                    ) : (
                      (data?.contactMessages || []).map((item: any) => (
                        <tr key={item.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors align-top">
                          <td className="p-5">
                            <div className="font-bold text-white">{item.name}</div>
                            <div className="text-xs text-blue-400 mt-1">{item.email}</div>
                            <div className="text-xs font-medium text-gray-400 mt-2 bg-white/5 inline-block px-2 py-1 rounded">{item.subject}</div>
                          </td>
                          <td className="p-5 text-sm">
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-gray-300 leading-relaxed">
                              {item.message}
                            </div>
                            {item.replyText && (
                              <div className="mt-3 pl-4 border-l-2 border-emerald-500 text-emerald-400/90 italic">
                                <span className="font-bold text-emerald-500 not-italic block mb-1 text-xs uppercase">Admin Reply:</span>
                                {item.replyText}
                              </div>
                            )}
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex flex-col items-end gap-2">
                               <button onClick={() => openReplyModal(item.id)} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-md">Reply</button>
                               <button onClick={() => handleDelete("contact", item.id)} className="w-full px-4 py-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg text-sm font-bold transition-all">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Global Settings */}
            {activeTab === "settings" && (
              <form onSubmit={saveSettings} className="bg-[#050812]/50 border border-white/[0.05] rounded-2xl p-8 backdrop-blur-md max-w-4xl">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xl">⚙️</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Platform Configurations</h3>
                    <p className="text-sm text-gray-400">Update brand assets and social graph links dynamically.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "IEM Logo URL", key: "iemLogo" },
                    { label: "UEM Logo URL", key: "uemLogo" },
                    { label: "MSS Logo URL", key: "mssLogo" },
                    { label: "Instagram URL", key: "instagramUrl" },
                    { label: "LinkedIn URL", key: "linkedinUrl" },
                    { label: "Facebook URL", key: "facebookUrl" },
                    { label: "WhatsApp URL", key: "whatsappUrl" }
                  ].map(field => (
                    <div key={field.key} className="flex flex-col">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{field.label}</label>
                      <input 
                        type="text" 
                        value={settings[field.key] || ""} 
                        onChange={e => setSettings({...settings, [field.key]: e.target.value})} 
                        className="w-full bg-black/50 border border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                        placeholder={`https://...`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-1">
                    Deploy Settings Sync
                  </button>
                </div>
              </form>
            )}

          </motion.div>
        )}
      </section>

      {/* General Entity Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0b101e] border border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">✏️</span>
                {editingItem ? "Edit Component Data" : "Deploy New Entity"}
              </h2>
              
              <form onSubmit={handleSave} className="space-y-4">
                {activeTab === "team" && (
                  <>
                    <input type="text" placeholder="Full Name" value={formState.name || ""} onChange={e => setFormState({...formState, name: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="email" placeholder="Email Address" value={formState.email || ""} onChange={e => setFormState({...formState, email: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Title/Designation" value={formState.title || ""} onChange={e => setFormState({...formState, title: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Category (e.g. executive_board, session_leads)" value={formState.category || ""} onChange={e => setFormState({...formState, category: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Photo URL" value={formState.photoUrl || ""} onChange={e => setFormState({...formState, photoUrl: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                  </>
                )}
                {activeTab === "tasks" && (
                  <>
                    <input type="text" placeholder="Task Title" value={formState.title || ""} onChange={e => setFormState({...formState, title: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Assigned Member ID (e.g. MB-1)" value={formState.assignedToMemberId || ""} onChange={e => setFormState({...formState, assignedToMemberId: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Deadline (YYYY-MM-DD)" value={formState.deadline || ""} onChange={e => setFormState({...formState, deadline: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <textarea placeholder="Task Description" value={formState.description || ""} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[120px]" />
                  </>
                )}
                {activeTab === "events" && (
                  <>
                    <input type="text" placeholder="Name" value={formState.name || ""} onChange={e => setFormState({...formState, name: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Date" value={formState.date || ""} onChange={e => setFormState({...formState, date: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Time" value={formState.time || ""} onChange={e => setFormState({...formState, time: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Venue" value={formState.venue || ""} onChange={e => setFormState({...formState, venue: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <textarea placeholder="Description" value={formState.description || ""} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[120px]" />
                  </>
                )}
                {activeTab === "gallery" && (
                  <>
                    <input type="text" placeholder="Title" value={formState.title || ""} onChange={e => setFormState({...formState, title: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Photo URL" value={formState.photoUrl || ""} onChange={e => setFormState({...formState, photoUrl: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <textarea placeholder="Description" value={formState.description || ""} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[120px]" />
                  </>
                )}
                {activeTab === "projects" && (
                  <>
                    <input type="text" placeholder="Title" value={formState.title || ""} onChange={e => setFormState({...formState, title: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Github URL" value={formState.githubUrl || ""} onChange={e => setFormState({...formState, githubUrl: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Live URL" value={formState.liveUrl || ""} onChange={e => setFormState({...formState, liveUrl: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <input type="text" placeholder="Tech Stack (comma separated)" value={formState.techStack || ""} onChange={e => setFormState({...formState, techStack: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                    <textarea placeholder="Description" value={formState.description || ""} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[120px]" />
                  </>
                )}
                
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 font-bold transition-all">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">Save Data</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Modal */}
      <AnimatePresence>
        {replyModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0b101e] border border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-blue-400">✉️</span> Respond to Inquiry
              </h2>
              <form onSubmit={submitReply}>
                <textarea 
                  placeholder="Type your official response here. This will be visible on the backend records..." 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)} 
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[140px]" 
                />
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setReplyModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 font-bold transition-all">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">Log Reply</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Interview Modal */}
      <AnimatePresence>
        {interviewModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0b101e] border border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-emerald-400">📅</span> Schedule Recruitment Interview
              </h2>
              <form onSubmit={submitInterview} className="space-y-4">
                <input type="text" placeholder="Meet Link (e.g. Teams/Zoom URL)" value={interviewDetails.meetLink} onChange={e => setInterviewDetails({...interviewDetails, meetLink: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                <input type="text" placeholder="Date & Time (e.g. 24th June, 10:00 AM)" value={interviewDetails.dateTime} onChange={e => setInterviewDetails({...interviewDetails, dateTime: e.target.value})} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                <textarea placeholder="Additional Notes to Candidate" value={interviewDetails.note} onChange={e => setInterviewDetails({...interviewDetails, note: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[100px]" />
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setInterviewModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 font-bold transition-all">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all">Dispatch Invite</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
