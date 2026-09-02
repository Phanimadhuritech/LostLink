import React, { useState, useEffect } from "react";
import {
  Search,
  PlusCircle,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Bell,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Calendar,
  Tag,
  AlertCircle,
  User,
  Shield,
  Trash2,
  Edit3,
  HelpCircle,
  ArrowLeft,
  Grid,
  Filter,
  Eye,
  RefreshCw,
  Sparkles,
  Lock,
  ArrowRight,
  Upload,
  Check,
  X,
  Menu,
  ChevronRight,
  ShieldCheck,
  SearchCheck,
  SlidersHorizontal,
  Compass,
  Clock,
  Info
} from "lucide-react";

// API Base configuration
const API_BASE = "https://lostlink-zoua.onrender.com/api";

export default function App() {
  // Authentication states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // UI Navigation states
  const [page, setPage] = useState("home"); // home, browse, how-it-works, about, login, register, dashboard, detail, report, edit
  const [dashboardTab, setDashboardTab] = useState("my-items"); // my-items, matches, claims-received, claims-made, notifications, profile, admin-users, admin-claims
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data list states
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Single active item for detail / edit
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemMatches, setItemMatches] = useState([]);
  const [itemClaims, setItemClaims] = useState([]);

  // Dashboard arrays
  const [myItems, setMyItems] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myMatches, setMyMatches] = useState([]);

  // Admin lists
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminClaims, setAdminClaims] = useState([]);

  // Search & filter fields
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // Input forms state
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    category: "Electronics",
    type: "LOST",
    location: "",
    date: "",
    verificationQuestion: "",
    verificationAnswer: ""
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", password: "" });
  const [claimAnswer, setClaimAnswer] = useState("");
  const [feedbackAnswer, setFeedbackAnswer] = useState("");

  // Feedback notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync profile form when user updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        password: ""
      });
    }
  }, [user]);

  // Load user session on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("lostlink_user");
    const savedToken = localStorage.getItem("lostlink_token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    fetchItems(1);
  }, []);

  // Sync dashboard data when user logs in or dashboard view changes
  useEffect(() => {
    if (token) {
      fetchNotifications();
      if (page === "dashboard") {
        fetchDashboardData();
      }
    }
  }, [token, page, dashboardTab]);

  // Flash feedback alerts helper
  const triggerAlert = (alertType, message) => {
    if (alertType === "error") {
      setErrorMsg(message);
      setSuccessMsg("");
      setTimeout(() => setErrorMsg(""), 5000);
    } else {
      setSuccessMsg(message);
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  };

  // ----------------------------------------------------
  // API REQUESTS - BACKEND CALLS
  // ----------------------------------------------------

  // Fetch items list with filters
  const fetchItems = async (pageNumber = 1) => {
    setLoading(true);
    try {
      let url = `${API_BASE}/items?page=${pageNumber}&limit=9`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (type) url += `&type=${encodeURIComponent(type)}`;
      if (location) url += `&location=${encodeURIComponent(location)}`;
      if (dateStart) url += `&dateStart=${dateStart}`;
      if (dateEnd) url += `&dateEnd=${dateEnd}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setTotalItems(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.pages);
      }
    } catch (err) {
      triggerAlert("error", "Failed to load reports from server.");
    } finally {
      setLoading(false);
    }
  };

  // Auth: register user
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("lostlink_user", JSON.stringify(data.user));
        localStorage.setItem("lostlink_token", data.token);
        setUser(data.user);
        setToken(data.token);
        triggerAlert("success", "Welcome to LostLink!");
        setPage("home");
        setAuthForm({ name: "", email: "", password: "", role: "user" });
      } else {
        triggerAlert("error", data.message || "Registration failed.");
      }
    } catch (err) {
      triggerAlert("error", "Registration request failed.");
    } finally {
      setLoading(false);
    }
  };

  // Auth: login user
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("lostlink_user", JSON.stringify(data.user));
        localStorage.setItem("lostlink_token", data.token);
        setUser(data.user);
        setToken(data.token);
        triggerAlert("success", "Signed in successfully.");
        setPage("home");
        setAuthForm({ name: "", email: "", password: "", role: "user" });
      } else {
        triggerAlert("error", data.message || "Invalid email or password.");
      }
    } catch (err) {
      triggerAlert("error", "Login request failed.");
    } finally {
      setLoading(false);
    }
  };

  // Auth: logout
  const handleLogout = () => {
    localStorage.removeItem("lostlink_user");
    localStorage.removeItem("lostlink_token");
    setUser(null);
    setToken(null);
    setPage("home");
    triggerAlert("success", "Logged out successfully.");
  };

  // Fetch user specific dashboard lists
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      if (dashboardTab === "my-items") {
        const res = await fetch(`${API_BASE}/items/my-items`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setMyItems(data.items);
      } else if (dashboardTab === "claims-received") {
        const res = await fetch(`${API_BASE}/claims/received`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setReceivedClaims(data.claims);
      } else if (dashboardTab === "claims-made") {
        const res = await fetch(`${API_BASE}/claims/my-claims`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setMyClaims(data.claims);
      } else if (dashboardTab === "notifications") {
        fetchNotifications();
      } else if (dashboardTab === "matches") {
        const res = await fetch(`${API_BASE}/items/matches/my-matches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setMyMatches(data.results);
      } else if (dashboardTab === "admin-users" && user?.role === "admin") {
        const res = await fetch(`${API_BASE}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setAdminUsers(data.users);
      } else if (dashboardTab === "admin-claims" && user?.role === "admin") {
        const res = await fetch(`${API_BASE}/claims`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setAdminClaims(data.claims);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchNotifications();
        triggerAlert("success", "All notifications marked as read.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Image file handler for report form
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles(files);
      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImagePreview = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // Submit lost/found report (Multi-part file upload)
  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!token) {
      triggerAlert("error", "Please sign in to report an item.");
      setPage("login");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(itemForm).forEach((key) => {
        formData.append(key, itemForm[key]);
      });
      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append("images", file);
        });
      }

      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("success", "Item reported successfully!");
        setItemForm({
          title: "",
          description: "",
          category: "Electronics",
          type: "LOST",
          location: "",
          date: "",
          verificationQuestion: "",
          verificationAnswer: ""
        });
        setImageFiles([]);
        setImagePreviews([]);
        setPage("browse");
        fetchItems(1);
      } else {
        triggerAlert("error", data.message || "Failed to submit report.");
      }
    } catch (err) {
      triggerAlert("error", "Could not submit report.");
    } finally {
      setLoading(false);
    }
  };

  // Update item report
  const handleUpdateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(itemForm).forEach((key) => {
        formData.append(key, itemForm[key]);
      });
      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append("images", file);
        });
      }

      const res = await fetch(`${API_BASE}/items/${selectedItem._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("success", "Report updated successfully!");
        setImageFiles([]);
        setImagePreviews([]);
        setPage("browse");
        fetchItems(1);
      } else {
        triggerAlert("error", data.message || "Failed to update report.");
      }
    } catch (err) {
      triggerAlert("error", "Could not update report.");
    } finally {
      setLoading(false);
    }
  };

  // Edit Profile: update user details
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("lostlink_user", JSON.stringify(data.user));
        setUser(data.user);
        triggerAlert("success", "Profile updated successfully.");
        setProfileForm({ ...profileForm, password: "" });
      } else {
        triggerAlert("error", data.message);
      }
    } catch (err) {
      triggerAlert("error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // View specific item details and matches/claims
  const viewItemDetail = async (item) => {
    setSelectedItem(item);
    setPage("detail");
    setActiveImageIndex(0);
    setClaimAnswer("");
    setItemMatches([]);
    setItemClaims([]);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Load potential matches and claims if logged-in user is owner
    if (token && user) {
      const isOwner = (item.userId?._id || item.userId) === (user.id || user._id);
      if (isOwner || user.role === "admin") {
        try {
          const resMatches = await fetch(`${API_BASE}/items/${item._id}/matches`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const dataMatches = await resMatches.json();
          if (dataMatches.success) setItemMatches(dataMatches.matches);

          const resClaims = await fetch(`${API_BASE}/claims/item/${item._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const dataClaims = await resClaims.json();
          if (dataClaims.success) setItemClaims(dataClaims.claims);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  // Submit verification claim
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      triggerAlert("error", "Please sign in to claim this item.");
      setPage("login");
      return;
    }
    if (!claimAnswer.trim()) {
      triggerAlert("error", "Please provide an answer to the verification question.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemId: selectedItem._id, verificationAnswer: claimAnswer })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("success", data.message || "Ownership verified! Claim approved successfully.");
        setClaimAnswer("");
        setPage("dashboard");
        setDashboardTab("claims-made");
      } else {
        triggerAlert("error", data.message || "Verification failed.");
      }
    } catch (err) {
      triggerAlert("error", "Failed to submit verification claim.");
    } finally {
      setLoading(false);
    }
  };

  // Owner action: decide claim (approve/reject)
  const handleDecideClaim = async (claimId, status) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/claims/${claimId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, feedback: feedbackAnswer })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("success", `Claim successfully ${status.toLowerCase()}ed.`);
        setFeedbackAnswer("");
        if (page === "detail") {
          viewItemDetail(selectedItem);
        } else {
          fetchDashboardData();
        }
      } else {
        triggerAlert("error", data.message);
      }
    } catch (err) {
      triggerAlert("error", "Error submitting decision.");
    } finally {
      setLoading(false);
    }
  };

  // Delete item report
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this report permanently?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("success", "Report deleted successfully.");
        setPage("browse");
        fetchItems(1);
      } else {
        triggerAlert("error", data.message);
      }
    } catch (err) {
      triggerAlert("error", "Could not delete report.");
    } finally {
      setLoading(false);
    }
  };

  // Mark item returned
  const handleMarkReturned = async (itemId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/items/${itemId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "RETURNED" })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("success", "Item marked as successfully returned.");
        if (page === "detail") {
          viewItemDetail(data.item);
        } else {
          fetchDashboardData();
        }
      } else {
        triggerAlert("error", data.message);
      }
    } catch (err) {
      triggerAlert("error", "Could not update status.");
    } finally {
      setLoading(false);
    }
  };

  // Admin delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user account? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("success", "User account removed.");
        fetchDashboardData();
      } else {
        triggerAlert("error", data.message);
      }
    } catch (err) {
      triggerAlert("error", "Could not delete user.");
    }
  };

  // Clear filters
  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setType("");
    setLocation("");
    setDateStart("");
    setDateEnd("");
    setLoading(true);
    fetch(`${API_BASE}/items?page=1&limit=9`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setItems(data.items);
          setTotalItems(data.total);
          setCurrentPage(data.page);
          setTotalPages(data.pages);
        }
      })
      .catch(() => triggerAlert("error", "Failed reset"))
      .finally(() => setLoading(false));
  };

  // Open Edit Form
  const openEditForm = (item) => {
    setSelectedItem(item);
    setItemForm({
      title: item.title,
      description: item.description,
      category: item.category,
      type: item.type,
      location: item.location,
      date: item.date ? item.date.substring(0, 10) : "",
      verificationQuestion: item.verificationQuestion,
      verificationAnswer: item.verificationAnswer || ""
    });
    setImageFiles([]);
    setImagePreviews([]);
    setPage("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startReport = (initialType = "LOST") => {
    setItemForm({
      title: "",
      description: "",
      category: "Electronics",
      type: initialType,
      location: "",
      date: new Date().toISOString().substring(0, 10),
      verificationQuestion: "",
      verificationAnswer: ""
    });
    setImageFiles([]);
    setImagePreviews([]);
    setPage("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categories = [
    "Electronics",
    "Documents",
    "Accessories",
    "Books",
    "Clothing",
    "Keys",
    "Wallet",
    "Other"
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="app-wrapper">
      {/* -------------------- ALERT BANNERS -------------------- */}
      <div className="alert-container">
        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle className="alert-icon" size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle className="alert-icon" size={18} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* -------------------- NAVBAR -------------------- */}
      <header className="navbar">
        <div className="container navbar-container">
          <div
            className="logo"
            onClick={() => {
              setPage("home");
              fetchItems(1);
            }}
          >
            <div className="logo-icon-wrap">
              <Sparkles size={20} />
            </div>
            Lost<span>Link</span>
          </div>

          <ul className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <li
              className={`nav-link ${page === "home" ? "active" : ""}`}
              onClick={() => {
                setPage("home");
                setMobileMenuOpen(false);
              }}
            >
              Home
            </li>
            <li
              className={`nav-link ${page === "browse" ? "active" : ""}`}
              onClick={() => {
                setPage("browse");
                setMobileMenuOpen(false);
                fetchItems(1);
              }}
            >
              Browse
            </li>
            <li
              className={`nav-link ${page === "how-it-works" ? "active" : ""}`}
              onClick={() => {
                setPage("how-it-works");
                setMobileMenuOpen(false);
              }}
            >
              How It Works
            </li>
            <li
              className={`nav-link ${page === "about" ? "active" : ""}`}
              onClick={() => {
                setPage("about");
                setMobileMenuOpen(false);
              }}
            >
              About
            </li>
          </ul>

          <div className="nav-actions">
            {token ? (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => startReport("LOST")}
                >
                  <PlusCircle size={16} />
                  <span>Report Item</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setPage("dashboard");
                    setDashboardTab("my-items");
                  }}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        backgroundColor: "var(--color-accent-dark)",
                        color: "#FFFFFF",
                        padding: "1px 6px",
                        borderRadius: "10px",
                        fontSize: "0.72rem",
                        marginLeft: "4px"
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  className="btn btn-soft btn-sm btn-icon-only"
                  title="Logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage("login")}
                >
                  <LogIn size={15} />
                  <span>Login</span>
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setPage("register")}
                >
                  <span>Get Started</span>
                </button>
              </>
            )}

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* -------------------- MAIN CONTENT PAGES -------------------- */}
      <main className="main-content">
        {/* ==================== LANDING PAGE ==================== */}
        {page === "home" && (
          <div>
            {/* Hero Section */}
            <section className="hero-section">
              <div className="container hero-grid">
                <div>
                  <div className="hero-pill">
                    <span className="hero-pill-dot"></span>
                    <span>The Secure Campus & Community Lost & Found</span>
                  </div>
                  <h1 className="hero-title">
                    Lost something? <br />
                    <span className="highlight">Let’s help you find it.</span>
                  </h1>
                  <p className="hero-subtitle">
                    LostLink connects people who have lost belongings with those who
                    have found them — securely and simply.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="btn btn-primary-dark btn-lg"
                      onClick={() => startReport("LOST")}
                    >
                      <PlusCircle size={18} />
                      <span>Report Lost Item</span>
                    </button>
                    <button
                      className="btn btn-soft btn-lg"
                      onClick={() => startReport("FOUND")}
                    >
                      <Compass size={18} />
                      <span>Report Found Item</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-lg"
                      onClick={() => {
                        setPage("browse");
                        fetchItems(1);
                      }}
                    >
                      <span>Browse Feed</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className="hero-trust-row">
                    <div className="trust-item">
                      <ShieldCheck className="trust-icon" size={18} />
                      <span>Answer-Protected Claims</span>
                    </div>
                    <div className="trust-item">
                      <SearchCheck className="trust-icon" size={18} />
                      <span>Smart Matching System</span>
                    </div>
                    <div className="trust-item">
                      <Sparkles className="trust-icon" size={18} />
                      <span>100% Free for Everyone</span>
                    </div>
                  </div>
                </div>

                {/* Hero Showcase Card */}
                <div>
                  <div className="hero-card-preview">
                    <div className="preview-badge-row">
                      <span className="badge badge-found">Verified Found</span>
                      <div className="confidence-indicator">
                        <Sparkles size={13} />
                        <span>Match Confidence 87%</span>
                      </div>
                    </div>

                    <div className="preview-match-box">
                      <div className="preview-match-title">Potential Match Found</div>
                      <div className="preview-item-row">
                        <div className="preview-item-icon">
                          <Tag size={20} />
                        </div>
                        <div className="preview-item-info">
                          <h4>Black Leather Wallet</h4>
                          <p>Accessories • Library 2nd Floor</p>
                        </div>
                      </div>
                    </div>

                    <div className="preview-verification-card">
                      <div className="preview-lock-icon">
                        <Lock size={16} />
                      </div>
                      <div>
                        <div className="preview-q-title">Protected Verification</div>
                        <div className="preview-q-desc">
                          "What initials or card is inside the side pocket?"
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="container" style={{ padding: "40px 24px 60px" }}>
              <div className="section-header text-center">
                <span className="section-tag">How It Works</span>
                <h2 className="section-title">Reuniting Belongings in 3 Easy Steps</h2>
                <p className="section-subtitle">
                  LostLink uses structured reporting and secure question-based
                  ownership verification to keep recovery safe and trustworthy.
                </p>
              </div>

              <div className="how-it-works-grid">
                <div className="step-card">
                  <div className="step-number">01</div>
                  <div className="step-icon-wrap">
                    <FileText size={24} />
                  </div>
                  <h3 className="step-title">Report an Item</h3>
                  <p className="step-desc">
                    Submit details, location, photos, and a secret verification
                    question that only the rightful owner can answer.
                  </p>
                </div>

                <div className="step-card">
                  <div className="step-number">02</div>
                  <div className="step-icon-wrap">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="step-title">Smart Match Engine</h3>
                  <p className="step-desc">
                    Our matching system analyzes titles, categories, dates, and
                    locations to automatically notify both parties.
                  </p>
                </div>

                <div className="step-card">
                  <div className="step-number">03</div>
                  <div className="step-icon-wrap">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="step-title">Secure Verification</h3>
                  <p className="step-desc">
                    Claimants answer the private verification question. Once
                    verified, contact details are exchanged to return the item.
                  </p>
                </div>
              </div>
            </section>

            {/* Recent Items Section */}
            <section className="container" style={{ padding: "0 24px 80px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: "32px",
                  flexWrap: "wrap",
                  gap: "16px"
                }}
              >
                <div>
                  <span className="section-tag">Live Feed</span>
                  <h2 className="section-title">Recent Community Reports</h2>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setPage("browse");
                    fetchItems(1);
                  }}
                >
                  <span>View All Items</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <Search size={32} />
                  </div>
                  <h3 className="empty-title">No Active Reports Yet</h3>
                  <p className="empty-desc">
                    Be the first to report a lost or found item in your community!
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => startReport("LOST")}
                  >
                    <PlusCircle size={16} />
                    <span>Report Lost Item</span>
                  </button>
                </div>
              ) : (
                <div className="item-grid">
                  {items.slice(0, 6).map((item) => (
                    <div key={item._id} className="item-card">
                      <div className="card-image-wrap">
                        {item.image ? (
                          <img
                            src={`https://lostlink-zoua.onrender.com${item.image}`}
                            alt={item.title}
                            className="card-img"
                          />
                        ) : (
                          <div className="card-img-placeholder">
                            <Tag size={36} />
                            <span style={{ fontSize: "0.82rem" }}>No Image Attached</span>
                          </div>
                        )}
                        <div className="card-badges">
                          <span
                            className={`badge ${item.type === "LOST" ? "badge-lost" : "badge-found"
                              }`}
                          >
                            {item.type}
                          </span>
                          <span className="badge badge-category">{item.category}</span>
                        </div>
                      </div>

                      <div className="card-body">
                        <h3 className="card-title">{item.title}</h3>
                        <p className="card-description">{item.description}</p>

                        <div className="card-meta-list">
                          <div className="card-meta-item">
                            <MapPin className="card-meta-icon" size={14} />
                            <span>{item.location}</span>
                          </div>
                          <div className="card-meta-item">
                            <Calendar className="card-meta-icon" size={14} />
                            <span>
                              {item.date ? new Date(item.date).toLocaleDateString() : "Recent"}
                            </span>
                          </div>
                        </div>

                        <div className="card-footer">
                          <span
                            className={`status-pill ${item.status === "ACTIVE"
                                ? "active"
                                : item.status === "CLAIMED"
                                  ? "claimed"
                                  : "returned"
                              }`}
                          >
                            <span className="status-pill-dot"></span>
                            {item.status}
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => viewItemDetail(item)}
                          >
                            <span>View Details</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ==================== BROWSE & SEARCH PAGE ==================== */}
        {page === "browse" && (
          <div className="container" style={{ padding: "48px 24px 80px" }}>
            <div className="section-header">
              <span className="section-tag">Search & Explore</span>
              <h1 className="section-title">Search Lost & Found Items</h1>
              <p className="section-subtitle">
                Filter by keywords, categories, location, or report type to find
                what you are looking for.
              </p>
            </div>

            {/* Filter Strip */}
            <div className="search-strip">
              <div className="search-strip-grid">
                <div className="search-input-wrap">
                  <Search className="search-input-icon" size={18} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search items by name, keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchItems(1)}
                  />
                </div>

                <div>
                  <select
                    className="select-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    className="select-field"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="LOST">Lost</option>
                    <option value="FOUND">Found</option>
                  </select>
                </div>

                <div className="search-input-wrap">
                  <MapPin className="search-input-icon" size={18} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Location filter..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => fetchItems(1)}
                  >
                    <Search size={16} />
                    <span>Search</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-icon-only"
                    title="Reset Filters"
                    onClick={resetFilters}
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Pills Quick Select */}
            <div className="category-pill-bar">
              <button
                className={`category-pill ${category === "" ? "active" : ""}`}
                onClick={() => {
                  setCategory("");
                  fetchItems(1);
                }}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-pill ${category === cat ? "active" : ""}`}
                  onClick={() => {
                    setCategory(cat);
                    fetchItems(1);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results Count */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}
            >
              <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                Showing <strong>{items.length}</strong> of{" "}
                <strong>{totalItems}</strong> reports
              </div>
            </div>

            {/* Items Grid */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <RefreshCw
                  className="spin"
                  size={32}
                  style={{ color: "var(--color-accent-dark)" }}
                />
                <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>
                  Loading community items...
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Search size={32} />
                </div>
                <h3 className="empty-title">No Matching Reports Found</h3>
                <p className="empty-desc">
                  Try adjusting your search terms, changing the category, or clearing
                  active filters.
                </p>
                <button className="btn btn-secondary" onClick={resetFilters}>
                  <RefreshCw size={15} />
                  <span>Clear All Filters</span>
                </button>
              </div>
            ) : (
              <>
                <div className="item-grid">
                  {items.map((item) => (
                    <div key={item._id} className="item-card">
                      <div className="card-image-wrap">
                        {item.image ? (
                          <img
                            src={`https://lostlink-zoua.onrender.com${item.image}`}
                            alt={item.title}
                            className="card-img"
                          />
                        ) : (
                          <div className="card-img-placeholder">
                            <Tag size={36} />
                            <span style={{ fontSize: "0.82rem" }}>No Image</span>
                          </div>
                        )}
                        <div className="card-badges">
                          <span
                            className={`badge ${item.type === "LOST" ? "badge-lost" : "badge-found"
                              }`}
                          >
                            {item.type}
                          </span>
                          <span className="badge badge-category">{item.category}</span>
                        </div>
                      </div>

                      <div className="card-body">
                        <h3 className="card-title">{item.title}</h3>
                        <p className="card-description">{item.description}</p>

                        <div className="card-meta-list">
                          <div className="card-meta-item">
                            <MapPin className="card-meta-icon" size={14} />
                            <span>{item.location}</span>
                          </div>
                          <div className="card-meta-item">
                            <Calendar className="card-meta-icon" size={14} />
                            <span>
                              {item.date
                                ? new Date(item.date).toLocaleDateString()
                                : "Recent"}
                            </span>
                          </div>
                        </div>

                        <div className="card-footer">
                          <span
                            className={`status-pill ${item.status === "ACTIVE"
                                ? "active"
                                : item.status === "CLAIMED"
                                  ? "claimed"
                                  : "returned"
                              }`}
                          >
                            <span className="status-pill-dot"></span>
                            {item.status}
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => viewItemDetail(item)}
                          >
                            <span>View Details</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "32px"
                    }}
                  >
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => fetchItems(currentPage - 1)}
                    >
                      Previous
                    </button>
                    <span
                      style={{
                        padding: "6px 14px",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => fetchItems(currentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==================== ITEM DETAILS PAGE ==================== */}
        {page === "detail" && selectedItem && (
          <div className="container" style={{ padding: "48px 24px 80px" }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: "28px" }}
              onClick={() => setPage("browse")}
            >
              <ArrowLeft size={16} />
              <span>Back to Browse</span>
            </button>

            <div className="detail-grid">
              {/* Left: Gallery */}
              <div className="detail-gallery">
                <div className="detail-main-img-wrap">
                  {selectedItem.images && selectedItem.images.length > 0 ? (
                    <img
                      src={`https://lostlink-zoua.onrender.com${selectedItem.images[activeImageIndex]}`}
                      alt={selectedItem.title}
                      className="detail-main-img"
                    />
                  ) : selectedItem.image ? (
                    <img
                      src={`https://lostlink-zoua.onrender.com${selectedItem.image}`}
                      alt={selectedItem.title}
                      className="detail-main-img"
                    />
                  ) : (
                    <div className="card-img-placeholder">
                      <Tag size={48} />
                      <span>No Photos Provided</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip if multiple */}
                {selectedItem.images && selectedItem.images.length > 1 && (
                  <div className="detail-thumbs-row">
                    {selectedItem.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={`https://lostlink-zoua.onrender.com${img}`}
                        alt="thumb"
                        className={`detail-thumb ${activeImageIndex === idx ? "active" : ""
                          }`}
                        onClick={() => setActiveImageIndex(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Item Info & Action Box */}
              <div>
                <div className="detail-card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "12px"
                    }}
                  >
                    <span
                      className={`badge ${selectedItem.type === "LOST" ? "badge-lost" : "badge-found"
                        }`}
                    >
                      {selectedItem.type}
                    </span>
                    <span className="badge badge-category">
                      {selectedItem.category}
                    </span>
                    <span
                      className={`status-pill ${selectedItem.status === "ACTIVE"
                          ? "active"
                          : selectedItem.status === "CLAIMED"
                            ? "claimed"
                            : "returned"
                        }`}
                    >
                      <span className="status-pill-dot"></span>
                      {selectedItem.status}
                    </span>
                  </div>

                  <h1 className="detail-title">{selectedItem.title}</h1>

                  <div className="detail-meta-grid">
                    <div>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          fontWeight: 700
                        }}
                      >
                        Location
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "4px",
                          fontWeight: 600
                        }}
                      >
                        <MapPin size={16} color="var(--color-accent-dark)" />
                        <span>{selectedItem.location}</span>
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          fontWeight: 700
                        }}
                      >
                        Date Reported
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "4px",
                          fontWeight: 600
                        }}
                      >
                        <Calendar size={16} color="var(--color-accent-dark)" />
                        <span>
                          {selectedItem.date
                            ? new Date(selectedItem.date).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <h4
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        marginBottom: "8px"
                      }}
                    >
                      Description
                    </h4>
                    <p
                      style={{
                        fontSize: "0.94rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.65,
                        whiteSpace: "pre-line"
                      }}
                    >
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Owner Controls */}
                  {user &&
                    (selectedItem.userId?._id === (user.id || user._id) ||
                      selectedItem.userId === (user.id || user._id) ||
                      user.role === "admin") && (
                      <div
                        style={{
                          padding: "18px",
                          background: "var(--bg-primary)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-subtle)",
                          marginBottom: "20px"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px"
                          }}
                        >
                          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                            Manage Your Report
                          </span>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--color-accent-dark)",
                              fontWeight: 600
                            }}
                          >
                            Reporter Controls
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {selectedItem.status === "ACTIVE" && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleMarkReturned(selectedItem._id)}
                            >
                              <CheckCircle size={14} />
                              <span>Mark as Returned</span>
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditForm(selectedItem)}
                          >
                            <Edit3 size={14} />
                            <span>Edit Report</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteItem(selectedItem._id)}
                          >
                            <Trash2 size={14} />
                            <span>Delete Report</span>
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Verification Claim Form (For other users claiming an active item) */}
                  {(!user ||
                    (selectedItem.userId?._id !== (user.id || user._id) &&
                      selectedItem.userId !== (user.id || user._id))) && (
                      <div className="verification-claim-card">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px"
                          }}
                        >
                          <ShieldCheck size={20} color="var(--color-accent-dark)" />
                          <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                            Verify Ownership to Claim
                          </h3>
                        </div>
                        <p
                          style={{
                            fontSize: "0.86rem",
                            color: "var(--text-secondary)"
                          }}
                        >
                          To ensure security, please answer the reporter's verification
                          question below.
                        </p>

                        <div className="verification-question-box">
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              marginBottom: "4px"
                            }}
                          >
                            Verification Question:
                          </div>
                          "{selectedItem.verificationQuestion}"
                        </div>

                        {selectedItem.status !== "ACTIVE" ? (
                          <div
                            style={{
                              padding: "12px",
                              background: "#FFFFFF",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.9rem",
                              color: "var(--text-secondary)",
                              textAlign: "center",
                              border: "1px solid var(--border-subtle)"
                            }}
                          >
                            This item is currently marked as{" "}
                            <strong>{selectedItem.status}</strong> and is not open for
                            new claims.
                          </div>
                        ) : (
                          <form onSubmit={handleClaimSubmit}>
                            <div className="form-group" style={{ marginBottom: "14px" }}>
                              <label className="form-label">Your Answer</label>
                              <input
                                type="text"
                                className="input-field input-field-noicon"
                                placeholder="Type your verification answer..."
                                value={claimAnswer}
                                onChange={(e) => setClaimAnswer(e.target.value)}
                                required
                              />
                              <div className="form-hint">
                                Answers are securely checked by LostLink. The correct
                                answer is never exposed publicly.
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="btn btn-primary-dark"
                              style={{ width: "100%" }}
                              disabled={loading}
                            >
                              <Shield size={16} />
                              <span>
                                {loading ? "Verifying..." : "Verify Ownership & Claim"}
                              </span>
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                </div>

                {/* Potential Matches for Item Owner */}
                {itemMatches.length > 0 && (
                  <div style={{ marginTop: "28px" }}>
                    <h3
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        marginBottom: "16px"
                      }}
                    >
                      Potential Smart Matches ({itemMatches.length})
                    </h3>
                    {itemMatches.map((m, idx) => (
                      <div key={idx} className="match-card">
                        <div className="match-header">
                          <span
                            className={`badge ${m.item.type === "LOST" ? "badge-lost" : "badge-found"
                              }`}
                          >
                            {m.item.type}
                          </span>
                          <div className="match-score-badge">
                            <Sparkles size={14} />
                            <span>Match Score: {Math.min(m.score, 99)}%</span>
                          </div>
                        </div>

                        <div className="match-comparison-grid">
                          <div className="match-item-box">
                            <h4>{m.item.title}</h4>
                            <p
                              style={{
                                fontSize: "0.85rem",
                                color: "var(--text-secondary)"
                              }}
                            >
                              Location: {m.item.location}
                            </p>
                            <p
                              style={{
                                fontSize: "0.85rem",
                                color: "var(--text-secondary)"
                              }}
                            >
                              Date:{" "}
                              {m.item.date
                                ? new Date(m.item.date).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => viewItemDetail(m.item)}
                        >
                          <span>Inspect Matched Item</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== REPORT LOST / FOUND FORM ==================== */}
        {(page === "report" || page === "edit") && (
          <div className="container-narrow" style={{ padding: "48px 24px 80px" }}>
            <div className="section-header text-center">
              <span className="section-tag">
                {page === "edit" ? "Edit Report" : "Report Item"}
              </span>
              <h1 className="section-title">
                {page === "edit"
                  ? "Update Item Details"
                  : itemForm.type === "LOST"
                    ? "Report a Lost Item"
                    : "Report a Found Item"}
              </h1>
              <p className="section-subtitle">
                Fill in the details below accurately to assist in matching and secure
                recovery.
              </p>
            </div>

            <div className="form-card">
              {page === "report" && (
                <div className="type-toggle-bar">
                  <button
                    type="button"
                    className={`type-toggle-btn ${itemForm.type === "LOST" ? "active-lost" : ""
                      }`}
                    onClick={() => setItemForm({ ...itemForm, type: "LOST" })}
                  >
                    I Lost an Item
                  </button>
                  <button
                    type="button"
                    className={`type-toggle-btn ${itemForm.type === "FOUND" ? "active-found" : ""
                      }`}
                    onClick={() => setItemForm({ ...itemForm, type: "FOUND" })}
                  >
                    I Found an Item
                  </button>
                </div>
              )}

              <form
                onSubmit={page === "edit" ? handleUpdateReport : handleCreateReport}
              >
                <div className="form-group">
                  <label className="form-label">Item Title / Name *</label>
                  <input
                    type="text"
                    className="input-field input-field-noicon"
                    placeholder="e.g. Silver MacBook Pro 14 inch, Blue Hydro Flask..."
                    value={itemForm.title}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="select-field"
                      value={itemForm.category}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, category: e.target.value })
                      }
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date (Lost / Found) *</label>
                    <input
                      type="date"
                      className="input-field input-field-noicon"
                      value={itemForm.date}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    className="input-field input-field-noicon"
                    placeholder="e.g. Student Union Cafeteria, Science Block Room 204..."
                    value={itemForm.location}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, location: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="textarea-field"
                    placeholder="Provide distinguishable details such as color, brand, scratches, condition, or stickers..."
                    value={itemForm.description}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, description: e.target.value })
                    }
                    required
                  ></textarea>
                </div>

                {/* Upload Photos */}
                <div className="form-group">
                  <label className="form-label">Upload Photos (Optional)</label>
                  <label className="upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleImageChange}
                    />
                    <div className="upload-icon">
                      <Upload size={22} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.94rem" }}>
                      Click to browse or drop images here
                    </div>
                    <div className="form-hint">
                      Supports JPG, PNG, WEBP up to 5MB
                    </div>
                  </label>

                  {imagePreviews.length > 0 && (
                    <div className="upload-thumbnails">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="thumb-preview-wrap">
                          <img
                            src={preview}
                            alt="preview"
                            className="thumb-preview-img"
                          />
                          <button
                            type="button"
                            className="thumb-remove-btn"
                            onClick={() => removeImagePreview(idx)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verification Question & Answer Setup */}
                <div className="verification-highlight-box">
                  <div className="verification-header-row">
                    <ShieldCheck size={20} color="var(--color-accent-dark)" />
                    <h4>Ownership Verification Setup</h4>
                  </div>
                  <p
                    style={{
                      fontSize: "0.84rem",
                      color: "var(--text-secondary)",
                      marginBottom: "16px"
                    }}
                  >
                    Establish a question that only the genuine owner will be able
                    to answer correctly when claiming this item.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Verification Question *</label>
                    <input
                      type="text"
                      className="input-field input-field-noicon"
                      placeholder="e.g. What sticker is on the back? What is the wallpaper image?"
                      value={itemForm.verificationQuestion}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          verificationQuestion: e.target.value
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Secret Answer *</label>
                    <input
                      type="text"
                      className="input-field input-field-noicon"
                      placeholder="e.g. Yellow smiling sun sticker, blue starry wallpaper..."
                      value={itemForm.verificationAnswer}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          verificationAnswer: e.target.value
                        })
                      }
                      required
                    />
                    <div className="form-hint">
                      This answer remains private and is never shown to other users.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    marginTop: "28px",
                    justifyContent: "flex-end"
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPage("browse")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-dark"
                    disabled={loading}
                  >
                    <Check size={16} />
                    <span>
                      {loading
                        ? "Saving Report..."
                        : page === "edit"
                          ? "Update Report"
                          : "Publish Report"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== DASHBOARD PAGE ==================== */}
        {page === "dashboard" && token && (
          <div className="container" style={{ padding: "48px 24px 80px" }}>
            <div className="dashboard-header">
              <div className="dashboard-welcome-row">
                <div>
                  <h1 className="dashboard-title">Welcome back, {user?.name} 👋</h1>
                  <p className="dashboard-subtitle">
                    Manage your reported items, potential smart matches, claims, and
                    notifications.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => startReport("LOST")}
                  >
                    <PlusCircle size={15} />
                    <span>Report Lost</span>
                  </button>
                  <button
                    className="btn btn-soft btn-sm"
                    onClick={() => startReport("FOUND")}
                  >
                    <Compass size={15} />
                    <span>Report Found</span>
                  </button>
                </div>
              </div>

              {/* Action Quick Cards */}
              <div className="dashboard-actions-grid">
                <div
                  className="dashboard-action-card"
                  onClick={() => startReport("LOST")}
                >
                  <div className="action-card-icon">
                    <PlusCircle size={20} color="var(--status-lost)" />
                  </div>
                  <div className="action-card-text">
                    <h4>Report Lost Item</h4>
                    <p>Publish item details & set secret question</p>
                  </div>
                </div>

                <div
                  className="dashboard-action-card"
                  onClick={() => startReport("FOUND")}
                >
                  <div className="action-card-icon">
                    <Compass size={20} color="var(--status-found)" />
                  </div>
                  <div className="action-card-text">
                    <h4>Report Found Item</h4>
                    <p>Help return an item safely to its owner</p>
                  </div>
                </div>

                <div
                  className="dashboard-action-card"
                  onClick={() => {
                    setPage("browse");
                    fetchItems(1);
                  }}
                >
                  <div className="action-card-icon">
                    <Search size={20} color="var(--text-primary)" />
                  </div>
                  <div className="action-card-text">
                    <h4>Browse Feed</h4>
                    <p>Explore all active reports in community</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Navigation Tabs */}
            <div className="dashboard-tabs">
              <button
                className={`dashboard-tab ${dashboardTab === "my-items" ? "active" : ""
                  }`}
                onClick={() => setDashboardTab("my-items")}
              >
                <Grid size={16} />
                <span>My Reports</span>
                <span className="tab-badge">{myItems.length}</span>
              </button>

              <button
                className={`dashboard-tab ${dashboardTab === "matches" ? "active" : ""
                  }`}
                onClick={() => setDashboardTab("matches")}
              >
                <Sparkles size={16} />
                <span>Potential Matches</span>
                <span className="tab-badge">{myMatches.length}</span>
              </button>

              <button
                className={`dashboard-tab ${dashboardTab === "claims-received" ? "active" : ""
                  }`}
                onClick={() => setDashboardTab("claims-received")}
              >
                <ShieldCheck size={16} />
                <span>Claims Received</span>
                <span className="tab-badge">{receivedClaims.length}</span>
              </button>

              <button
                className={`dashboard-tab ${dashboardTab === "claims-made" ? "active" : ""
                  }`}
                onClick={() => setDashboardTab("claims-made")}
              >
                <FileText size={16} />
                <span>My Claims</span>
                <span className="tab-badge">{myClaims.length}</span>
              </button>

              <button
                className={`dashboard-tab ${dashboardTab === "notifications" ? "active" : ""
                  }`}
                onClick={() => setDashboardTab("notifications")}
              >
                <Bell size={16} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      backgroundColor: "var(--color-accent-dark)",
                      color: "#FFFFFF",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontSize: "0.72rem"
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                className={`dashboard-tab ${dashboardTab === "profile" ? "active" : ""
                  }`}
                onClick={() => setDashboardTab("profile")}
              >
                <User size={16} />
                <span>Profile Settings</span>
              </button>

              {user?.role === "admin" && (
                <>
                  <button
                    className={`dashboard-tab ${dashboardTab === "admin-users" ? "active" : ""
                      }`}
                    onClick={() => setDashboardTab("admin-users")}
                  >
                    <Shield size={16} />
                    <span>Admin Users</span>
                  </button>
                  <button
                    className={`dashboard-tab ${dashboardTab === "admin-claims" ? "active" : ""
                      }`}
                    onClick={() => setDashboardTab("admin-claims")}
                  >
                    <Shield size={16} />
                    <span>Admin Claims</span>
                  </button>
                </>
              )}
            </div>

            {/* TAB CONTENT: MY REPORTS */}
            {dashboardTab === "my-items" && (
              <div>
                {myItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon-wrap">
                      <Grid size={32} />
                    </div>
                    <h3 className="empty-title">No Reports Created Yet</h3>
                    <p className="empty-desc">
                      You haven't posted any lost or found items yet.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => startReport("LOST")}
                    >
                      <PlusCircle size={16} />
                      <span>Report Lost Item</span>
                    </button>
                  </div>
                ) : (
                  <div className="item-grid">
                    {myItems.map((item) => (
                      <div key={item._id} className="item-card">
                        <div className="card-image-wrap">
                          {item.image ? (
                            <img
                              src={`https://lostlink-zoua.onrender.com${item.image}`}
                              alt={item.title}
                              className="card-img"
                            />
                          ) : (
                            <div className="card-img-placeholder">
                              <Tag size={36} />
                              <span style={{ fontSize: "0.82rem" }}>No Image</span>
                            </div>
                          )}
                          <div className="card-badges">
                            <span
                              className={`badge ${item.type === "LOST" ? "badge-lost" : "badge-found"
                                }`}
                            >
                              {item.type}
                            </span>
                            <span className="badge badge-category">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="card-body">
                          <h3 className="card-title">{item.title}</h3>
                          <p className="card-description">{item.description}</p>

                          <div className="card-meta-list">
                            <div className="card-meta-item">
                              <MapPin className="card-meta-icon" size={14} />
                              <span>{item.location}</span>
                            </div>
                            <div className="card-meta-item">
                              <Calendar className="card-meta-icon" size={14} />
                              <span>
                                {item.date
                                  ? new Date(item.date).toLocaleDateString()
                                  : "Recent"}
                              </span>
                            </div>
                          </div>

                          <div className="card-footer">
                            <span
                              className={`status-pill ${item.status === "ACTIVE"
                                  ? "active"
                                  : item.status === "CLAIMED"
                                    ? "claimed"
                                    : "returned"
                                }`}
                            >
                              <span className="status-pill-dot"></span>
                              {item.status}
                            </span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="btn btn-secondary btn-sm btn-icon-only"
                                title="Edit"
                                onClick={() => openEditForm(item)}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                className="btn btn-danger btn-sm btn-icon-only"
                                title="Delete"
                                onClick={() => handleDeleteItem(item._id)}
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => viewItemDetail(item)}
                              >
                                <span>Details</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: POTENTIAL MATCHES */}
            {dashboardTab === "matches" && (
              <div>
                {myMatches.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon-wrap">
                      <Sparkles size={32} />
                    </div>
                    <h3 className="empty-title">No Potential Matches Yet</h3>
                    <p className="empty-desc">
                      As new lost and found reports are submitted with matching
                      keywords, categories, and dates, they will automatically
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div>
                    {myMatches.map((group, gIdx) => (
                      <div key={gIdx} style={{ marginBottom: "36px" }}>
                        <h3
                          style={{
                            fontSize: "1.15rem",
                            fontWeight: 700,
                            marginBottom: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          <Tag size={18} color="var(--color-accent-dark)" />
                          <span>Matches for your "{group.item.title}"</span>
                        </h3>

                        {group.matches.map((m, mIdx) => (
                          <div key={mIdx} className="match-card">
                            <div className="match-header">
                              <span
                                className={`badge ${m.item.type === "LOST"
                                    ? "badge-lost"
                                    : "badge-found"
                                  }`}
                              >
                                {m.item.type}
                              </span>
                              <div className="match-score-badge">
                                <Sparkles size={14} />
                                <span>
                                  Match Confidence: {Math.min(m.score, 99)}%
                                </span>
                              </div>
                            </div>

                            <div className="match-comparison-grid">
                              <div className="match-item-box">
                                <div
                                  style={{
                                    fontSize: "0.76rem",
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase"
                                  }}
                                >
                                  Your Report
                                </div>
                                <h4>{group.item.title}</h4>
                                <p
                                  style={{
                                    fontSize: "0.84rem",
                                    color: "var(--text-secondary)"
                                  }}
                                >
                                  {group.item.location} •{" "}
                                  {new Date(group.item.date).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="match-divider">VS</div>

                              <div className="match-item-box">
                                <div
                                  style={{
                                    fontSize: "0.76rem",
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase"
                                  }}
                                >
                                  Found Match Candidate
                                </div>
                                <h4>{m.item.title}</h4>
                                <p
                                  style={{
                                    fontSize: "0.84rem",
                                    color: "var(--text-secondary)"
                                  }}
                                >
                                  {m.item.location} •{" "}
                                  {new Date(m.item.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "10px"
                              }}
                            >
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => viewItemDetail(m.item)}
                              >
                                <span>Inspect & Claim Item</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CLAIMS RECEIVED */}
            {dashboardTab === "claims-received" && (
              <div>
                {receivedClaims.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon-wrap">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="empty-title">No Claims Received</h3>
                    <p className="empty-desc">
                      When someone answers the verification question for items you
                      reported, their claim will appear here for your review.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {receivedClaims.map((claim) => (
                      <div
                        key={claim._id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-lg)",
                          padding: "24px",
                          boxShadow: "var(--shadow-sm)"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "14px",
                            flexWrap: "wrap",
                            gap: "10px"
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--text-muted)",
                                textTransform: "uppercase"
                              }}
                            >
                              Claim on Item
                            </span>
                            <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                              {claim.itemId?.title || "Item"}
                            </h3>
                          </div>
                          <span
                            className={`status-pill ${claim.status === "APPROVED"
                                ? "returned"
                                : claim.status === "PENDING"
                                  ? "active"
                                  : "claimed"
                              }`}
                          >
                            <span className="status-pill-dot"></span>
                            {claim.status}
                          </span>
                        </div>

                        <div
                          style={{
                            padding: "14px",
                            background: "var(--bg-primary)",
                            borderRadius: "var(--radius-md)",
                            marginBottom: "16px"
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.82rem",
                              color: "var(--text-muted)",
                              marginBottom: "4px"
                            }}
                          >
                            Claimer: <strong>{claim.claimerId?.name}</strong> (
                            {claim.claimerId?.email})
                          </div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 600 }}>
                            Claimer's Answer: "{claim.verificationAnswer}"
                          </div>
                        </div>

                        {claim.status === "PENDING" && (
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              justifyContent: "flex-end"
                            }}
                          >
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDecideClaim(claim._id, "REJECTED")}
                            >
                              <XCircle size={14} />
                              <span>Reject Claim</span>
                            </button>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleDecideClaim(claim._id, "APPROVED")}
                            >
                              <CheckCircle size={14} />
                              <span>Approve Claim</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: MY CLAIMS */}
            {dashboardTab === "claims-made" && (
              <div>
                {myClaims.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon-wrap">
                      <FileText size={32} />
                    </div>
                    <h3 className="empty-title">No Claims Submitted Yet</h3>
                    <p className="empty-desc">
                      When you verify ownership on an item, your submission and
                      approval status will be tracked here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {myClaims.map((claim) => (
                      <div
                        key={claim._id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-lg)",
                          padding: "24px",
                          boxShadow: "var(--shadow-sm)"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "12px"
                          }}
                        >
                          <div>
                            <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                              {claim.itemId?.title || "Reported Item"}
                            </h3>
                            <p
                              style={{
                                fontSize: "0.84rem",
                                color: "var(--text-secondary)",
                                marginTop: "2px"
                              }}
                            >
                              Submitted on{" "}
                              {new Date(claim.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`status-pill ${claim.status === "APPROVED"
                                ? "returned"
                                : claim.status === "PENDING"
                                  ? "active"
                                  : "claimed"
                              }`}
                          >
                            <span className="status-pill-dot"></span>
                            {claim.status}
                          </span>
                        </div>

                        <div
                          style={{
                            padding: "14px",
                            background: "var(--bg-primary)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.88rem"
                          }}
                        >
                          <div>
                            Your Submitted Answer: "
                            <strong>{claim.verificationAnswer}</strong>"
                          </div>
                          {claim.feedback && (
                            <div
                              style={{
                                marginTop: "6px",
                                color: "var(--text-secondary)"
                              }}
                            >
                              Feedback: {claim.feedback}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: NOTIFICATIONS */}
            {dashboardTab === "notifications" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px"
                  }}
                >
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                    Notifications Feed
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={markAllNotificationsRead}
                    >
                      <CheckCircle size={14} />
                      <span>Mark All as Read</span>
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon-wrap">
                      <Bell size={32} />
                    </div>
                    <h3 className="empty-title">All Caught Up!</h3>
                    <p className="empty-desc">
                      You have no unread notifications at the moment.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {notifications.map((n) => (
                      <div
                        key={n._id}
                        style={{
                          background: n.isRead ? "#FFFFFF" : "var(--bg-secondary)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                          padding: "18px 22px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "14px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <Bell
                            size={18}
                            color={
                              n.isRead
                                ? "var(--text-muted)"
                                : "var(--color-accent-dark)"
                            }
                          />
                          <div>
                            <p
                              style={{
                                fontSize: "0.92rem",
                                fontWeight: n.isRead ? 400 : 600,
                                color: "var(--text-primary)"
                              }}
                            >
                              {n.message}
                            </p>
                            <span
                              style={{
                                fontSize: "0.76rem",
                                color: "var(--text-muted)"
                              }}
                            >
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {!n.isRead && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => markNotificationRead(n._id)}
                          >
                            <span>Mark Read</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PROFILE SETTINGS */}
            {dashboardTab === "profile" && (
              <div className="container-narrow" style={{ padding: 0 }}>
                <div className="form-card">
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      marginBottom: "20px"
                    }}
                  >
                    Update Account Profile
                  </h3>
                  <form onSubmit={handleUpdateProfile}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="input-field input-field-noicon"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="input-field input-field-noicon"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">New Password (Optional)</label>
                      <input
                        type="password"
                        className="input-field input-field-noicon"
                        placeholder="Leave blank to keep current password"
                        value={profileForm.password}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            password: e.target.value
                          })
                        }
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary-dark"
                      disabled={loading}
                    >
                      <Check size={16} />
                      <span>{loading ? "Updating..." : "Save Changes"}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ADMIN USERS */}
            {dashboardTab === "admin-users" && user?.role === "admin" && (
              <div className="form-card">
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    marginBottom: "18px"
                  }}
                >
                  Admin User Moderation
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.9rem"
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1.5px solid var(--border-subtle)",
                          textAlign: "left"
                        }}
                      >
                        <th style={{ padding: "10px" }}>Name</th>
                        <th style={{ padding: "10px" }}>Email</th>
                        <th style={{ padding: "10px" }}>Role</th>
                        <th style={{ padding: "10px" }}>Created</th>
                        <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((u) => (
                        <tr
                          key={u._id}
                          style={{ borderBottom: "1px solid var(--border-subtle)" }}
                        >
                          <td style={{ padding: "12px 10px", fontWeight: 600 }}>
                            {u.name}
                          </td>
                          <td style={{ padding: "12px 10px" }}>{u.email}</td>
                          <td style={{ padding: "12px 10px" }}>
                            <span className="badge badge-category">{u.role}</span>
                          </td>
                          <td style={{ padding: "12px 10px" }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "12px 10px", textAlign: "right" }}>
                            {u._id !== (user.id || user._id) && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteUser(u._id)}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ADMIN CLAIMS */}
            {dashboardTab === "admin-claims" && user?.role === "admin" && (
              <div className="form-card">
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    marginBottom: "18px"
                  }}
                >
                  Global Claims Overview
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {adminClaims.map((ac) => (
                    <div
                      key={ac._id}
                      style={{
                        padding: "16px",
                        background: "var(--bg-primary)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          Item: {ac.itemId?.title || "Item"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.84rem",
                            color: "var(--text-secondary)"
                          }}
                        >
                          Claimer: {ac.claimerId?.name} ({ac.claimerId?.email}) • Answer: "
                          {ac.verificationAnswer}"
                        </div>
                      </div>
                      <span
                        className={`status-pill ${ac.status === "APPROVED"
                            ? "returned"
                            : ac.status === "PENDING"
                              ? "active"
                              : "claimed"
                          }`}
                      >
                        {ac.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== AUTH PAGES (LOGIN / REGISTER) ==================== */}
        {(page === "login" || page === "register") && (
          <div className="container auth-wrapper">
            <div className="auth-card">
              <div className="auth-tabs">
                <div
                  className={`auth-tab ${page === "login" ? "active" : ""}`}
                  onClick={() => setPage("login")}
                >
                  Sign In
                </div>
                <div
                  className={`auth-tab ${page === "register" ? "active" : ""}`}
                  onClick={() => setPage("register")}
                >
                  Create Account
                </div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                  {page === "login" ? "Welcome to LostLink" : "Join LostLink"}
                </h2>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    marginTop: "4px"
                  }}
                >
                  {page === "login"
                    ? "Enter your credentials to access your dashboard."
                    : "Create a free account to report and claim items."}
                </p>
              </div>

              <form onSubmit={page === "login" ? handleLogin : handleRegister}>
                {page === "register" && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="input-field input-field-noicon"
                      placeholder="e.g. Alex Johnson"
                      value={authForm.name}
                      onChange={(e) =>
                        setAuthForm({ ...authForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="input-field input-field-noicon"
                    placeholder="alex@campus.edu or email@domain.com"
                    value={authForm.email}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="input-field input-field-noicon"
                    placeholder="Minimum 6 characters"
                    value={authForm.password}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, password: e.target.value })
                    }
                    required
                  />
                </div>

                {page === "register" && (
                  <div className="form-group">
                    <label className="form-label">Account Role</label>
                    <select
                      className="select-field"
                      value={authForm.role}
                      onChange={(e) =>
                        setAuthForm({ ...authForm, role: e.target.value })
                      }
                    >
                      <option value="user">Standard User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary-dark"
                  style={{ width: "100%", marginTop: "10px" }}
                  disabled={loading}
                >
                  {page === "login" ? (
                    <>
                      <LogIn size={16} />
                      <span>{loading ? "Signing in..." : "Sign In"}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>
                        {loading ? "Creating Account..." : "Create Free Account"}
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Demo Fill Helper */}
              <div className="demo-credentials-box">
                <span>Quick Demo Fill:</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setAuthForm({
                      ...authForm,
                      email: "demo@lostlink.com",
                      password: "password123",
                      name: "Demo Student"
                    })
                  }
                >
                  Fill Demo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== HOW IT WORKS INFO PAGE ==================== */}
        {page === "how-it-works" && (
          <div className="container" style={{ padding: "48px 24px 80px" }}>
            <div className="section-header text-center">
              <span className="section-tag">Platform Architecture</span>
              <h1 className="section-title">How LostLink Protects Recoveries</h1>
              <p className="section-subtitle">
                A modern digital lost-and-found built on confidentiality, automated
                matching, and question-verified claims.
              </p>
            </div>

            <div className="how-it-works-grid">
              <div className="step-card">
                <div className="step-icon-wrap">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="step-title">Answer-Protected System</h3>
                <p className="step-desc">
                  When you report an item, you formulate a verification question.
                  The answer is stored securely and never transmitted over public
                  API routes.
                </p>
              </div>

              <div className="step-card">
                <div className="step-icon-wrap">
                  <Sparkles size={28} />
                </div>
                <h3 className="step-title">Instant Keyword Matcher</h3>
                <p className="step-desc">
                  LostLink scans titles, descriptions, categories, and locations to
                  generate similarity confidence ratings between lost and found
                  entries.
                </p>
              </div>

              <div className="step-card">
                <div className="step-icon-wrap">
                  <Bell size={28} />
                </div>
                <h3 className="step-title">Real-Time Alerts</h3>
                <p className="step-desc">
                  Both reporters and claimants receive immediate notifications as
                  soon as a potential match or claim is registered on the platform.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ABOUT PAGE ==================== */}
        {page === "about" && (
          <div className="container-narrow" style={{ padding: "48px 24px 80px" }}>
            <div className="section-header text-center">
              <span className="section-tag">About LostLink</span>
              <h1 className="section-title">Reuniting Communities With Care</h1>
              <p className="section-subtitle">
                LostLink was designed to replace chaotic lost-and-found notice boards
                with a modern, elegant, and secure platform.
              </p>
            </div>

            <div className="form-card" style={{ lineHeight: 1.8 }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "12px" }}>
                Our Mission
              </h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                Losing personal items like student IDs, keys, laptops, and wallets is
                stressful. LostLink creates a centralized, trustworthy bridge between
                finders and owners while preventing fraudulent claims through secret
                verification Q&A.
              </p>

              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "12px" }}>
                Core Safety Principles
              </h3>
              <ul
                style={{
                  color: "var(--text-secondary)",
                  paddingLeft: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <li>
                  <strong>Confidential Verification:</strong> Stored answers are never
                  revealed on public pages or API responses.
                </li>
                <li>
                  <strong>Safe Communication:</strong> Verified claims notify owners
                  directly, keeping personal contact private until confirmed.
                </li>
                <li>
                  <strong>Audit Trail:</strong> Every claim and status change is logged
                  and manageable in the user's dashboard.
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div
                className="logo"
                onClick={() => {
                  setPage("home");
                  fetchItems(1);
                }}
              >
                <div className="logo-icon-wrap">
                  <Sparkles size={20} />
                </div>
                Lost<span>Link</span>
              </div>
              <p className="footer-desc">
                The smart, secure lost-and-found web application for universities,
                workspaces, and local communities.
              </p>
            </div>

            <div className="footer-col">
              <h4>Navigation</h4>
              <ul className="footer-links">
                <li
                  className="footer-link"
                  onClick={() => {
                    setPage("home");
                    fetchItems(1);
                  }}
                >
                  Home
                </li>
                <li
                  className="footer-link"
                  onClick={() => {
                    setPage("browse");
                    fetchItems(1);
                  }}
                >
                  Browse Items
                </li>
                <li
                  className="footer-link"
                  onClick={() => setPage("how-it-works")}
                >
                  How It Works
                </li>
                <li className="footer-link" onClick={() => setPage("about")}>
                  About Us
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Actions</h4>
              <ul className="footer-links">
                <li
                  className="footer-link"
                  onClick={() => startReport("LOST")}
                >
                  Report Lost Item
                </li>
                <li
                  className="footer-link"
                  onClick={() => startReport("FOUND")}
                >
                  Report Found Item
                </li>
                <li className="footer-link" onClick={() => setPage("login")}>
                  Sign In
                </li>
                <li className="footer-link" onClick={() => setPage("register")}>
                  Create Account
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Security & Privacy</h4>
              <ul className="footer-links">
                <li className="footer-link">Protected Q&A Verification</li>
                <li className="footer-link">Encrypted Auth & Tokens</li>
                <li className="footer-link">Admin Moderation Support</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} LostLink. All rights reserved.</div>
            <div style={{ display: "flex", gap: "18px" }}>
              <span>Strict Palette: #FFF5F5 • #F7D6D0 • #E2B4BD • #4A4A4A</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
