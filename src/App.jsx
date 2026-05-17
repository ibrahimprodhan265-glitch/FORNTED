import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  ChevronRight,
  CirclePower,
  Database,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  Radio,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  User,
  Users,
  Zap
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const USER_TOKEN_KEY = "hyperRegedit.userToken";
const ADMIN_TOKEN_KEY = "hyperRegedit.adminToken";
const DEVICE_ID_KEY = "hyperRegedit.deviceId";

const initialSettings = {
  brandName: "Hyper Regedit Access",
  appIconUrl: "/icon.png",
  loginBackgroundUrl: "/assets/hyper-logo.jpeg",
  telegramUrl: "https://t.me/your_support",
  maintenanceEnabled: false,
  maintenanceMessage: "System maintenance is running. Please try again later.",
  webClipUrl: "https://yourdomain.com/app"
};

function deviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next =
    crypto.randomUUID?.() ||
    `device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

async function api(path, options = {}, token = "") {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function readToken(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
}

function storeToken(key, token, remember) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
  (remember ? localStorage : sessionStorage).setItem(key, token);
}

function clearToken(key) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

function formatDate(value) {
  if (!value) return "Permanent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function daysLeft(value) {
  if (!value) return "Infinite";
  const diff = new Date(value).getTime() - Date.now();
  if (diff < 0) return "Expired";
  return `${Math.max(1, Math.ceil(diff / 86400000))} days`;
}

function asIsoFromInput(value) {
  return value ? new Date(value).toISOString() : null;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function NeonButton({ children, className = "", ...props }) {
  return (
    <button className={`neon-button ${className}`} {...props}>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`toggle ${checked ? "toggle-on" : ""}`}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}

function AppIcon({ src, size = "lg" }) {
  return (
    <div className={`app-icon app-icon-${size}`}>
      <img src={src || "/icon.png"} alt="" />
    </div>
  );
}

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

export default function App() {
  const installedApp = isStandaloneApp();
  const [mode, setMode] = useState(window.location.pathname.includes("admin") && !installedApp ? "admin" : "user");
  const [settings, setSettings] = useState(initialSettings);
  const [packages, setPackages] = useState([]);
  const [options, setOptions] = useState([]);
  const [userToken, setUserToken] = useState(readToken(USER_TOKEN_KEY));
  const [adminToken, setAdminToken] = useState(readToken(ADMIN_TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState("");

  const currentDeviceId = useMemo(deviceId, []);

  useEffect(() => {
    let alive = true;
    async function boot() {
      try {
        const bootData = await api("/api/bootstrap");
        if (!alive) return;
        setSettings(bootData.settings || initialSettings);
        setPackages(bootData.packages || []);
        setOptions(bootData.options || []);

        if (userToken && mode !== "admin") {
          const data = await api("/api/me", {}, userToken);
          setUser(data.user);
          setOptions(data.options || []);
          setSettings(data.settings || initialSettings);
        }
      } catch (error) {
        setNotice(error.message);
        clearToken(USER_TOKEN_KEY);
        setUserToken("");
      } finally {
        if (alive) setBooting(false);
      }
    }
    boot();
    return () => {
      alive = false;
    };
  }, [mode, userToken]);

  function goAdmin() {
    window.history.pushState({}, "", "/admin");
    setMode("admin");
  }

  function goApp() {
    window.history.pushState({}, "", "/app");
    setMode("user");
  }

  return (
    <main className="cyber-bg min-h-dvh overflow-x-hidden text-white">
      <div className="scanline" />
      {mode === "admin" ? (
        <AdminApp
          settings={settings}
          setSettings={setSettings}
          packages={packages}
          setPackages={setPackages}
          options={options}
          setOptions={setOptions}
          adminToken={adminToken}
          setAdminToken={setAdminToken}
          goApp={goApp}
        />
      ) : (
        <UserApp
          booting={booting}
          notice={notice}
          settings={settings}
          setSettings={setSettings}
          packages={packages}
          options={options}
          setOptions={setOptions}
          user={user}
          setUser={setUser}
          userToken={userToken}
          setUserToken={setUserToken}
          currentDeviceId={currentDeviceId}
          installedApp={installedApp}
          goAdmin={goAdmin}
        />
      )}
    </main>
  );
}

function UserApp({
  booting,
  notice,
  settings,
  setSettings,
  packages,
  options,
  setOptions,
  user,
  setUser,
  userToken,
  setUserToken,
  currentDeviceId,
  installedApp,
  goAdmin
}) {
  if (booting) return <Splash settings={settings} />;

  if (!user) {
    return (
      <LoginScreen
        settings={settings}
        notice={notice}
        currentDeviceId={currentDeviceId}
        showAdminLink={!installedApp}
        onLogin={({ token, user: nextUser, options: nextOptions, settings: nextSettings }, remember) => {
          storeToken(USER_TOKEN_KEY, token, remember);
          setUserToken(token);
          setUser(nextUser);
          setOptions(nextOptions || options);
          if (nextSettings) setSettings(nextSettings);
        }}
        goAdmin={goAdmin}
      />
    );
  }

  return (
    <Dashboard
      settings={settings}
      packages={packages}
      options={options}
      user={user}
      token={userToken}
      setUser={setUser}
      onLogout={async () => {
        try {
          await api("/api/auth/logout", { method: "POST" }, userToken);
        } catch {
          // The local token is still cleared when the server session is already gone.
        }
        clearToken(USER_TOKEN_KEY);
        setUserToken("");
        setUser(null);
      }}
    />
  );
}

function Splash({ settings }) {
  return (
    <section className="phone-wrap">
      <motion.div
        className="phone-shell splash-shell"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <AppIcon src={settings.appIconUrl} />
        <h1>{settings.brandName}</h1>
        <div className="loading-track">
          <motion.span initial={{ width: "12%" }} animate={{ width: "86%" }} transition={{ duration: 1.4 }} />
        </div>
      </motion.div>
    </section>
  );
}

function LoginScreen({ settings, notice, currentDeviceId, showAdminLink, onLogin, goAdmin }) {
  const [form, setForm] = useState({ username: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [message, setMessage] = useState(notice || "");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ ...form, deviceId: currentDeviceId })
      });
      setLoginSuccess(true);
      window.setTimeout(() => onLogin(data, form.remember), 420);
    } catch (error) {
      setMessage(error.message);
      setLoginSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="coded-login-wrap"
      style={{ "--login-bg": `url("${settings.loginBackgroundUrl || "/assets/hyper-logo.jpeg"}")` }}
    >
      <motion.div
        className={`coded-login-frame ${loginSuccess ? "coded-login-exit" : ""}`}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="coded-login-hero">
          <div className="coded-logo-mark">
            <img src="/assets/hyper-logo.jpeg" alt="" />
          </div>
          <h1>HYPER <span>REGEDIT</span></h1>
          <p>ACCESS</p>
        </div>

        <form className="coded-login-card" onSubmit={submit} aria-label="Hyper Regedit login">
          <div className="coded-shield">
            <ShieldCheck size={28} />
          </div>
          <h2>WELCOME BACK</h2>
          <p className="coded-subtitle">Login to access your Hyper Regedit account</p>

          <label className="coded-field">
            <span>EMAIL OR USERNAME</span>
            <div className="coded-input-shell">
              <User size={22} />
              <input
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                placeholder="Enter your email or username"
                autoComplete="username"
                aria-label="Email or Username"
              />
            </div>
          </label>

          <label className="coded-field">
            <span>PASSWORD</span>
            <div className="coded-input-shell">
              <LockKeyhole size={21} />
              <input
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-label="Password"
              />
              <button
                type="button"
                className={`coded-eye ${showPassword ? "coded-eye-on" : ""}`}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
              </button>
            </div>
          </label>

          <label className="coded-remember">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(event) => setForm({ ...form, remember: event.target.checked })}
            />
            <span className="coded-check" />
            <span>REMEMBER ME</span>
          </label>

          <button className={`coded-login-button ${loading ? "coded-login-button-loading" : ""}`} disabled={loading}>
            <LockKeyhole size={22} />
            <strong>{loading ? "CHECKING" : "LOGIN"}</strong>
          </button>

          {message ? <p className="coded-login-message">{message}</p> : null}

          <div className="coded-security-row">
            <span><ShieldCheck size={17} /> SECURE CONNECTION</span>
            <i />
            <span><LockKeyhole size={17} /> ENCRYPTED</span>
            <i />
            <span><ShieldCheck size={17} /> PROTECTED</span>
          </div>
        </form>

        <p className="coded-login-footer">(c) 2026 HYPER REGEDIT ACCESS - ALL RIGHTS RESERVED.</p>

        {showAdminLink ? (
          <button className="coded-admin-link" onClick={goAdmin}>
            Admin Panel <ChevronRight size={16} />
          </button>
        ) : null}
      </motion.div>
    </section>
  );
}

function Dashboard({ settings, packages, options, user, token, setUser, onLogout }) {
  const [message, setMessage] = useState("");
  const [busyOption, setBusyOption] = useState("");
  const activePackage = packages.find((item) => item.id === user.packageId);

  async function toggleOption(option, enabled) {
    setBusyOption(option.id);
    setMessage("");
    try {
      const data = await api(
        `/api/me/options/${option.id}`,
        { method: "PATCH", body: JSON.stringify({ enabled }) },
        token
      );
      setUser({ ...user, optionStates: data.optionStates });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyOption("");
    }
  }

  return (
    <section className="phone-wrap dashboard-wrap">
      <motion.div className="phone-shell dashboard-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="dash-header">
          <div>
            <p>Hello, {user.username}</p>
            <h1>{settings.brandName}</h1>
          </div>
          <AppIcon src={settings.appIconUrl} size="sm" />
        </header>

        <div className="status-grid">
          <div className="mini-stat">
            <Package size={18} />
            <span>Package</span>
            <strong>{activePackage?.name || user.packageName}</strong>
          </div>
          <div className="mini-stat">
            <CalendarClock size={18} />
            <span>Expire</span>
            <strong>{daysLeft(user.expiresAt)}</strong>
          </div>
          <div className="mini-stat">
            <Radio size={18} />
            <span>Status</span>
            <strong className={user.status === "Active" ? "good" : "bad"}>{user.status}</strong>
          </div>
        </div>

        <div className="option-list">
          {options.map((option) => {
            const checked = Boolean(user.optionStates?.[option.id]);
            return (
              <motion.div
                className={`option-card ${!option.enabled ? "option-disabled" : ""}`}
                key={option.id}
                whileTap={{ scale: 0.99 }}
              >
                <div className="option-mark">
                  {option.iconUrl ? <img src={option.iconUrl} alt="" /> : <span>{option.symbol}</span>}
                </div>
                <div>
                  <h3>{option.name}</h3>
                  <p>Status: {option.enabled ? (checked ? "ON" : "OFF") : "ADMIN OFF"}</p>
                </div>
                <Toggle
                  checked={checked}
                  disabled={!option.enabled || busyOption === option.id}
                  onChange={(value) => toggleOption(option, value)}
                />
              </motion.div>
            );
          })}
        </div>

        {message ? <p className="error-text">{message}</p> : null}

        <div className="glass-card account-card">
          <h2>Account Info</h2>
          <div>
            <span>Username</span>
            <strong>{user.username}</strong>
          </div>
          <div>
            <span>Package</span>
            <strong>{user.packageName}</strong>
          </div>
          <div>
            <span>Expire Date</span>
            <strong>{formatDate(user.expiresAt)}</strong>
          </div>
          <div>
            <span>Device</span>
            <strong>{user.deviceId ? "Locked" : "Pending"}</strong>
          </div>
        </div>

        <div className="dash-actions">
          <a className="support-button" href={settings.telegramUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> Support
          </a>
          <button className="logout-button" onClick={onLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </motion.div>
    </section>
  );
}

function AdminApp({ settings, setSettings, packages, setPackages, options, setOptions, adminToken, setAdminToken, goApp }) {
  const [adminReady, setAdminReady] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");

  async function loadAdminData(token = adminToken) {
    if (!token) return;
    const [summaryData, userData, optionData, packageData, settingsData, logData] = await Promise.all([
      api("/api/admin/summary", {}, token),
      api("/api/admin/users", {}, token),
      api("/api/admin/options", {}, token),
      api("/api/admin/packages", {}, token),
      api("/api/admin/settings", {}, token),
      api("/api/admin/logs", {}, token)
    ]);
    setSummary(summaryData);
    setUsers(userData.users || []);
    setOptions(optionData.options || []);
    setPackages(packageData.packages || []);
    setSettings(settingsData.settings || settings);
    setLogs(logData.logs || []);
    setAdminReady(true);
  }

  useEffect(() => {
    if (!adminToken) {
      setAdminReady(false);
      return;
    }
    loadAdminData().catch((error) => {
      setMessage(error.message);
      clearToken(ADMIN_TOKEN_KEY);
      setAdminToken("");
      setAdminReady(false);
    });
  }, [adminToken]);

  if (!adminToken || !adminReady) {
    return (
      <AdminLogin
        settings={settings}
        message={message}
        goApp={goApp}
        onLogin={(token, adminUser, remember) => {
          storeToken(ADMIN_TOKEN_KEY, token, remember);
          setAdminToken(token);
          setAdmin(adminUser);
        }}
      />
    );
  }

  const tabs = [
    ["dashboard", Activity, "Dashboard"],
    ["users", Users, "Users"],
    ["options", Zap, "Options"],
    ["packages", Package, "Packages"],
    ["settings", Settings, "Settings"],
    ["logs", Database, "Logs"]
  ];

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar glass-card">
        <div className="admin-brand">
          <AppIcon src={settings.appIconUrl} size="sm" />
          <div>
            <strong>HYPER REGEDIT</strong>
            <span>Admin Console</span>
          </div>
        </div>
        <nav>
          {tabs.map(([id, Icon, label]) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <button
          className="sidebar-logout"
          onClick={() => {
            clearToken(ADMIN_TOKEN_KEY);
            setAdminToken("");
            setAdminReady(false);
          }}
        >
          <LogOut size={18} /> Logout
        </button>
        <button className="sidebar-logout secondary" onClick={goApp}>
          <Smartphone size={18} /> User App
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-top">
          <div>
            <p>{admin?.username || "admin"}</p>
            <h1>{tabs.find(([id]) => id === tab)?.[2]}</h1>
          </div>
          <span className={settings.maintenanceEnabled ? "pill danger" : "pill good"}>
            {settings.maintenanceEnabled ? "Maintenance" : "Online"}
          </span>
        </header>

        {tab === "dashboard" ? <AdminDashboard summary={summary} logs={logs} /> : null}
        {tab === "users" ? (
          <UsersPanel token={adminToken} users={users} setUsers={setUsers} packages={packages} reload={loadAdminData} />
        ) : null}
        {tab === "options" ? (
          <OptionsPanel token={adminToken} options={options} setOptions={setOptions} reload={loadAdminData} />
        ) : null}
        {tab === "packages" ? (
          <PackagesPanel token={adminToken} packages={packages} setPackages={setPackages} reload={loadAdminData} />
        ) : null}
        {tab === "settings" ? (
          <SettingsPanel
            token={adminToken}
            settings={settings}
            setSettings={setSettings}
            reload={loadAdminData}
          />
        ) : null}
        {tab === "logs" ? <LogsPanel logs={logs} /> : null}
      </div>
    </section>
  );
}

function AdminLogin({ settings, message, onLogin, goApp }) {
  const [form, setForm] = useState({ username: "admin", password: "", remember: true });
  const [error, setError] = useState(message);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/auth/admin-login", {
        method: "POST",
        body: JSON.stringify(form)
      });
      onLogin(data.token, data.admin, form.remember);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="phone-wrap">
      <motion.form className="phone-shell admin-login glass-card" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <AppIcon src={settings.appIconUrl} />
        <h1>ADMIN PANEL</h1>
        <Field label="Admin Username">
          <div className="input-shell">
            <User size={18} />
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          </div>
        </Field>
        <Field label="Admin Password">
          <div className="input-shell">
            <LockKeyhole size={18} />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="ADMIN-2026"
            />
          </div>
        </Field>
        <label className="remember">
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(event) => setForm({ ...form, remember: event.target.checked })}
          />
          Remember admin
        </label>
        <NeonButton disabled={loading}>
          <ShieldCheck size={18} /> {loading ? "OPENING" : "LOGIN"}
        </NeonButton>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="button" className="admin-link" onClick={goApp}>
          User App <ChevronRight size={16} />
        </button>
      </motion.form>
    </section>
  );
}

function AdminDashboard({ summary, logs }) {
  const stats = [
    ["Total Users", summary?.totalUsers || 0, Users],
    ["Active Users", summary?.activeUsers || 0, ShieldCheck],
    ["Expired Users", summary?.expiredUsers || 0, CalendarClock],
    ["Online Now", summary?.onlineUsers || 0, Radio]
  ];
  return (
    <div className="admin-grid">
      {stats.map(([label, value, Icon]) => (
        <div className="glass-card admin-stat" key={label}>
          <Icon size={22} />
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      <div className="glass-card admin-wide">
        <h2>Login Activity</h2>
        <LogTable logs={logs.slice(0, 8)} />
      </div>
    </div>
  );
}

function UsersPanel({ token, users, setUsers, packages, reload }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    packageId: packages[0]?.id || "",
    status: "Active",
    expiresAt: ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!form.packageId && packages[0]?.id) setForm((current) => ({ ...current, packageId: packages[0].id }));
  }, [packages]);

  async function createUser(event) {
    event.preventDefault();
    setMessage("");
    try {
      const data = await api(
        "/api/admin/users",
        {
          method: "POST",
          body: JSON.stringify({ ...form, expiresAt: asIsoFromInput(form.expiresAt) })
        },
        token
      );
      setUsers([data.user, ...users]);
      setForm({ ...form, username: "", password: "", expiresAt: "" });
      setMessage("User created");
      reload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateUser(userId, patch) {
    const data = await api(
      `/api/admin/users/${userId}`,
      { method: "PATCH", body: JSON.stringify(patch) },
      token
    );
    setUsers(users.map((user) => (user.id === userId ? data.user : user)));
    reload();
  }

  async function deleteUser(userId) {
    await api(`/api/admin/users/${userId}`, { method: "DELETE" }, token);
    setUsers(users.filter((user) => user.id !== userId));
    reload();
  }

  return (
    <div className="panel-grid">
      <form className="glass-card admin-form" onSubmit={createUser}>
        <h2>Add New User</h2>
        <Field label="Username">
          <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
        </Field>
        <Field label="Password">
          <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        </Field>
        <Field label="Select Package">
          <select value={form.packageId} onChange={(event) => setForm({ ...form, packageId: event.target.value })}>
            {packages.map((pkg) => (
              <option value={pkg.id} key={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Expire Date">
          <input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option>Active</option>
            <option>Suspended</option>
            <option>Expired</option>
          </select>
        </Field>
        <NeonButton>
          <Plus size={17} /> Add User
        </NeonButton>
        {message ? <p className="muted">{message}</p> : null}
      </form>

      <div className="glass-card data-card">
        <h2>Users</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Package</th>
                <th>Expire</th>
                <th>Status</th>
                <th>Device</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.packageName}</td>
                  <td>{formatDate(user.expiresAt)}</td>
                  <td>
                    <span className={user.status === "Active" ? "good" : "bad"}>{user.status}</span>
                  </td>
                  <td>{user.deviceId ? "Locked" : "Open"}</td>
                  <td className="action-row">
                    <button onClick={() => updateUser(user.id, { status: user.status === "Active" ? "Suspended" : "Active" })}>
                      <CirclePower size={15} />
                    </button>
                    <button onClick={() => updateUser(user.id, { resetDevice: true })}>
                      <Smartphone size={15} />
                    </button>
                    <button onClick={() => deleteUser(user.id)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OptionsPanel({ token, options, setOptions, reload }) {
  const blank = { name: "", symbol: "", iconUrl: "", description: "", sortOrder: 100, enabled: true };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");

  async function saveOption(event) {
    event.preventDefault();
    const path = editingId ? `/api/admin/options/${editingId}` : "/api/admin/options";
    const method = editingId ? "PATCH" : "POST";
    const data = await api(path, { method, body: JSON.stringify(form) }, token);
    setOptions(editingId ? options.map((item) => (item.id === editingId ? data.option : item)) : [...options, data.option]);
    setForm(blank);
    setEditingId("");
    setMessage("Option saved");
    reload();
  }

  async function deleteOption(optionId) {
    await api(`/api/admin/options/${optionId}`, { method: "DELETE" }, token);
    setOptions(options.filter((item) => item.id !== optionId));
    reload();
  }

  return (
    <div className="panel-grid">
      <form className="glass-card admin-form" onSubmit={saveOption}>
        <h2>{editingId ? "Edit Option" : "Add Option"}</h2>
        <Field label="Option Name">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </Field>
        <Field label="Short Icon Text">
          <input value={form.symbol} onChange={(event) => setForm({ ...form, symbol: event.target.value.toUpperCase().slice(0, 3) })} />
        </Field>
        <Field label="Icon URL or Data">
          <input value={form.iconUrl} onChange={(event) => setForm({ ...form, iconUrl: event.target.value })} />
        </Field>
        <label className="upload-line">
          <Upload size={16} />
          Upload option icon
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) setForm({ ...form, iconUrl: await fileToDataUrl(file) });
            }}
          />
        </label>
        <Field label="Description">
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </Field>
        <Field label="Sort">
          <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
        </Field>
        <label className="remember">
          <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
          Enabled for users
        </label>
        <NeonButton>
          <Save size={17} /> Save Option
        </NeonButton>
        {editingId ? (
          <button type="button" className="ghost-button" onClick={() => { setEditingId(""); setForm(blank); }}>
            Clear
          </button>
        ) : null}
        {message ? <p className="muted">{message}</p> : null}
      </form>

      <div className="glass-card data-card">
        <h2>Dashboard Options</h2>
        <div className="option-admin-list">
          {options.map((option) => (
            <div className="option-card" key={option.id}>
              <div className="option-mark">
                {option.iconUrl ? <img src={option.iconUrl} alt="" /> : <span>{option.symbol}</span>}
              </div>
              <div>
                <h3>{option.name}</h3>
                <p>{option.enabled ? "Visible" : "Hidden"} / {option.description}</p>
              </div>
              <div className="action-row">
                <button onClick={() => { setEditingId(option.id); setForm(option); }}>
                  <Settings size={15} />
                </button>
                <button onClick={() => deleteOption(option.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PackagesPanel({ token, packages, setPackages, reload }) {
  const blank = { name: "", price: "", durationDays: 7, status: "Active" };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState("");

  async function savePackage(event) {
    event.preventDefault();
    const path = editingId ? `/api/admin/packages/${editingId}` : "/api/admin/packages";
    const method = editingId ? "PATCH" : "POST";
    const data = await api(path, { method, body: JSON.stringify(form) }, token);
    setPackages(editingId ? packages.map((item) => (item.id === editingId ? data.package : item)) : [...packages, data.package]);
    setForm(blank);
    setEditingId("");
    reload();
  }

  async function deletePackage(packageId) {
    await api(`/api/admin/packages/${packageId}`, { method: "DELETE" }, token);
    setPackages(packages.filter((item) => item.id !== packageId));
    reload();
  }

  return (
    <div className="panel-grid">
      <form className="glass-card admin-form" onSubmit={savePackage}>
        <h2>{editingId ? "Edit Package" : "Add Package"}</h2>
        <Field label="Package Name">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </Field>
        <Field label="Price">
          <input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        </Field>
        <Field label="Duration Days">
          <input
            type="number"
            value={form.durationDays}
            onChange={(event) => setForm({ ...form, durationDays: event.target.value })}
          />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option>Active</option>
            <option>Paused</option>
          </select>
        </Field>
        <NeonButton>
          <Save size={17} /> Save Package
        </NeonButton>
      </form>

      <div className="glass-card data-card package-list">
        <h2>Packages</h2>
        {packages.map((pkg) => (
          <div className="package-row" key={pkg.id}>
            <div>
              <strong>{pkg.name}</strong>
              <span>{pkg.durationDays} days / BDT {pkg.price}</span>
            </div>
            <span className={pkg.status === "Active" ? "pill good" : "pill danger"}>{pkg.status}</span>
            <button onClick={() => { setEditingId(pkg.id); setForm(pkg); }}>
              <Settings size={15} />
            </button>
            <button onClick={() => deletePackage(pkg.id)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel({ token, settings, setSettings, reload }) {
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState("");

  useEffect(() => setForm(settings), [settings]);

  async function saveSettings(event) {
    event.preventDefault();
    const data = await api("/api/admin/settings", { method: "PATCH", body: JSON.stringify(form) }, token);
    setSettings(data.settings);
    setMessage("Settings saved");
    reload();
  }

  return (
    <form className="glass-card settings-panel" onSubmit={saveSettings}>
      <div className="settings-preview">
        <AppIcon src={form.appIconUrl} />
        <div>
          <h2>{form.brandName}</h2>
          <p>{form.webClipUrl}</p>
        </div>
      </div>
      <Field label="Brand Name">
        <input value={form.brandName} onChange={(event) => setForm({ ...form, brandName: event.target.value })} />
      </Field>
      <Field label="App Icon URL or Data">
        <input value={form.appIconUrl} onChange={(event) => setForm({ ...form, appIconUrl: event.target.value })} />
      </Field>
      <label className="upload-line">
        <Upload size={16} />
        Upload new app icon
        <input
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setForm({ ...form, appIconUrl: await fileToDataUrl(file) });
          }}
        />
      </label>
      <Field label="Login Background URL or Data">
        <input
          value={form.loginBackgroundUrl || ""}
          onChange={(event) => setForm({ ...form, loginBackgroundUrl: event.target.value })}
        />
      </Field>
      <label className="upload-line">
        <Upload size={16} />
        Upload login background
        <input
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setForm({ ...form, loginBackgroundUrl: await fileToDataUrl(file) });
          }}
        />
      </label>
      <Field label="Telegram Support URL">
        <input value={form.telegramUrl} onChange={(event) => setForm({ ...form, telegramUrl: event.target.value })} />
      </Field>
      <Field label="Web Clip URL">
        <input value={form.webClipUrl} onChange={(event) => setForm({ ...form, webClipUrl: event.target.value })} />
      </Field>
      <label className="remember">
        <input
          type="checkbox"
          checked={form.maintenanceEnabled}
          onChange={(event) => setForm({ ...form, maintenanceEnabled: event.target.checked })}
        />
        Maintenance mode
      </label>
      <Field label="Maintenance Message">
        <textarea
          value={form.maintenanceMessage}
          onChange={(event) => setForm({ ...form, maintenanceMessage: event.target.value })}
        />
      </Field>
      <NeonButton>
        <Save size={17} /> Save Settings
      </NeonButton>
      {message ? <p className="muted">{message}</p> : null}
    </form>
  );
}

function LogsPanel({ logs }) {
  return (
    <div className="glass-card data-card">
      <h2>Access Logs</h2>
      <LogTable logs={logs} />
    </div>
  );
}

function LogTable({ logs }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Action</th>
            <th>IP Address</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.username || "-"}</td>
              <td>{log.action}</td>
              <td>{log.ipAddress || "-"}</td>
              <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
