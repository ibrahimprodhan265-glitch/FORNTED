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
const SETTINGS_CACHE_KEY = "hyperRegedit.settings";
const DAY_MS = 86400000;

const initialSettings = {
  brandName: "Hyper Regedit Access",
  appIconUrl: "/icon.png",
  webClipLabel: "Hyper Access",
  splashImageUrl: "/icon.png",
  splashText: "Loading Hyper Regedit Access",
  loginBackgroundUrl: "/assets/hyper-logo.jpeg",
  dashboardLogoUrl: "/icon.png",
  liveBackgroundUrl: "/assets/hyper-logo.jpeg",
  developerName: "ESE Developer",
  developerBannerUrl: "",
  telegramUrl: "https://t.me/your_support",
  maintenanceEnabled: false,
  maintenanceMessage: "System maintenance is running. Please try again later.",
  webClipUrl: "https://fornted.onrender.com/app"
};

function settingsWithDefaults(value = {}) {
  return { ...initialSettings, ...(value || {}) };
}

function loadCachedSettings() {
  try {
    return settingsWithDefaults(JSON.parse(localStorage.getItem(SETTINGS_CACHE_KEY) || "{}"));
  } catch {
    return initialSettings;
  }
}

function cacheSettings(value) {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settingsWithDefaults(value)));
  } catch {
    // Large uploaded data URLs can exceed browser storage; the server value still applies after bootstrap.
  }
}

function mobileConfigUrl() {
  const base = API_BASE || window.location.origin;
  try {
    return new URL("/hyper-regedit-access.mobileconfig", base).toString();
  } catch {
    return new URL("/hyper-regedit-access.mobileconfig", window.location.origin).toString();
  }
}

function deviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next =
    crypto.randomUUID?.() ||
    `device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

function deviceName() {
  const ua = navigator.userAgent || "";
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  if (/iPad/i.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/Android/i.test(ua)) {
    const model = ua.match(/Android[^;]*;\s*([^;)]+)\)/i)?.[1]?.replace(/\s*Build\/.*$/i, "").trim();
    return model || "Android Device";
  }
  if (/Windows/i.test(ua)) return "Windows Device";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac Device";
  return platform || "Unknown Device";
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
  return `${Math.max(1, Math.ceil(diff / DAY_MS))} days`;
}

function liveSubscription(value, now = Date.now()) {
  if (!value) return "Life Subscription";
  const diff = new Date(value).getTime() - now;
  if (Number.isNaN(diff)) return "Not set";
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / DAY_MS);
  const hours = Math.floor((diff % DAY_MS) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function userAccessActive(user = {}) {
  return user.status === "Active" && (!user.expiresAt || new Date(user.expiresAt).getTime() > Date.now());
}

function needsExactDeviceName(value = "") {
  return ["iPhone", "iPad", "Android Device", "Unknown Device"].includes(value);
}

function asIsoFromInput(value) {
  return value ? new Date(value).toISOString() : null;
}

function expiryFromMode(mode, customValue) {
  if (mode === "custom") return asIsoFromInput(customValue);
  return new Date(Date.now() + Number(mode || 7) * DAY_MS).toISOString();
}

function generateAccessKey(days = 7) {
  const bytes = new Uint8Array(5);
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
  const randomPart = cryptoApi?.getRandomValues
    ? Array.from(bytes)
        .map((byte) => byte.toString(36).padStart(2, "0"))
        .join("")
        .toUpperCase()
    : Math.random().toString(36).slice(2, 12).toUpperCase();
  return `HYPER-${days}D-${randomPart.slice(0, 10)}`;
}

function shiftIsoDays(value, delta) {
  const currentTime = value ? new Date(value).getTime() : Date.now();
  const base = Number.isNaN(currentTime) || currentTime < Date.now() ? Date.now() : currentTime;
  return new Date(base + Number(delta || 0) * DAY_MS).toISOString();
}

function logDeviceLabel(userAgent = "") {
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "Mac";
  return "Unknown";
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

function isVideoAsset(src = "") {
  return /^data:video\//i.test(src) || /\.(mp4|webm|ogg)(\?|#|$)/i.test(src);
}

function preloadVisualAsset(src = "") {
  const source = String(src || "").trim();
  if (!source || typeof document === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, 2500);

    if (isVideoAsset(source)) {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.onloadeddata = finish;
      video.onerror = finish;
      video.src = source;
      video.load?.();
      return;
    }

    const image = new Image();
    image.onload = finish;
    image.onerror = finish;
    image.src = source;
  });
}

function LiveLogo({ src, fallback = "/icon.png" }) {
  const source = src || fallback;
  return (
    <div className="live-logo">
      {isVideoAsset(source) ? (
        <video src={source} autoPlay muted loop playsInline />
      ) : (
        <img src={source} alt="" />
      )}
    </div>
  );
}

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

export default function App() {
  const installedApp = isStandaloneApp();
  const [mode, setMode] = useState(window.location.pathname.includes("admin") && !installedApp ? "admin" : "user");
  const [settings, setSettings] = useState(loadCachedSettings);
  const [packages, setPackages] = useState([]);
  const [options, setOptions] = useState([]);
  const [userToken, setUserToken] = useState(readToken(USER_TOKEN_KEY));
  const [adminToken, setAdminToken] = useState(readToken(ADMIN_TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [bootVisualReady, setBootVisualReady] = useState(false);
  const [notice, setNotice] = useState("");

  const currentDeviceId = useMemo(deviceId, []);
  const currentDeviceName = useMemo(deviceName, []);

  useEffect(() => {
    let alive = true;
    async function boot() {
      let splashStartedAt = Date.now();
      setBooting(true);
      setBootVisualReady(false);
      try {
        const bootData = await api("/api/bootstrap");
        if (!alive) return;
        const bootSettings = settingsWithDefaults(bootData.settings);
        let visualSettings = bootSettings;
        setSettings(bootSettings);
        cacheSettings(bootSettings);
        setPackages(bootData.packages || []);
        setOptions(bootData.options || []);

        if (userToken && mode !== "admin") {
          const data = await api("/api/me", {}, userToken);
          setUser(data.user);
          setOptions(data.options || []);
          const nextSettings = settingsWithDefaults(data.settings);
          visualSettings = nextSettings;
          setSettings(nextSettings);
          cacheSettings(nextSettings);
        }
        await preloadVisualAsset(visualSettings.splashImageUrl || visualSettings.appIconUrl);
        if (!alive) return;
        setBootVisualReady(true);
        splashStartedAt = Date.now();
      } catch (error) {
        setNotice(error.message);
        clearToken(USER_TOKEN_KEY);
        setUserToken("");
        if (alive) {
          setBootVisualReady(true);
          splashStartedAt = Date.now();
        }
      } finally {
        const delay = Math.max(900, 1600 - (Date.now() - splashStartedAt));
        window.setTimeout(() => {
          if (alive) setBooting(false);
        }, delay);
      }
    }
    boot();
    return () => {
      alive = false;
    };
  }, []);

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
          bootVisualReady={bootVisualReady}
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
          currentDeviceName={currentDeviceName}
          installedApp={installedApp}
          goAdmin={goAdmin}
        />
      )}
    </main>
  );
}

function UserApp({
  booting,
  bootVisualReady,
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
  currentDeviceName,
  installedApp,
  goAdmin
}) {
  if (booting) return bootVisualReady ? <Splash settings={settings} /> : <PreSplash />;

  if (!user) {
    return (
      <LoginScreen
        settings={settings}
        notice={notice}
        currentDeviceId={currentDeviceId}
        currentDeviceName={currentDeviceName}
        showAdminLink={!installedApp}
        onLogin={({ token, user: nextUser, options: nextOptions, settings: nextSettings }, remember) => {
          storeToken(USER_TOKEN_KEY, token, remember);
          setUserToken(token);
          setUser(nextUser);
          setOptions(nextOptions || options);
          if (nextSettings) {
            const mergedSettings = settingsWithDefaults(nextSettings);
            setSettings(mergedSettings);
            cacheSettings(mergedSettings);
          }
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
      currentDeviceId={currentDeviceId}
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

function PreSplash() {
  return (
    <section className="phone-wrap">
      <div className="phone-shell splash-shell pre-splash-shell">
        <div className="pre-splash-pulse" />
      </div>
    </section>
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
        <motion.div
          className="splash-visual"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 16 }}
        >
          <LiveLogo
            key={settings.splashImageUrl || settings.appIconUrl}
            src={settings.splashImageUrl || settings.appIconUrl}
            fallback={settings.appIconUrl}
          />
        </motion.div>
        <h1>{settings.brandName}</h1>
        <p>{settings.splashText || "Loading Hyper Regedit Access"}</p>
        <div className="loading-track">
          <motion.span initial={{ width: "12%" }} animate={{ width: "86%" }} transition={{ duration: 1.4 }} />
        </div>
      </motion.div>
    </section>
  );
}

function LoginScreen({ settings, notice, currentDeviceId, currentDeviceName, showAdminLink, onLogin, goAdmin }) {
  const [form, setForm] = useState({ password: "", remember: false });
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
        body: JSON.stringify({ ...form, deviceId: currentDeviceId, deviceName: currentDeviceName })
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
          <p className="coded-subtitle">Enter your admin generated access key</p>

          <label className="coded-field">
            <span>ACCESS KEY</span>
            <div className="coded-input-shell">
              <LockKeyhole size={21} />
              <input
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter your access key"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-label="Access key"
                required
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

function Dashboard({ settings, packages, options, user, currentDeviceId, token, setUser, onLogout }) {
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState("success");
  const [busyOption, setBusyOption] = useState("");
  const [gameMode, setGameMode] = useState("Free Fire");
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [now, setNow] = useState(Date.now());
  const activePackage = packages.find((item) => item.id === user.packageId);
  const displayDeviceId = currentDeviceId || user.deviceId || "Unknown Device ID";
  const subscriptionTime = liveSubscription(user.expiresAt, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function selectGameMode(mode) {
    setGameMode(mode);
    setMessageKind("success");
    setMessage(`${mode} Injected`);
    window.setTimeout(() => setMessage(""), 1800);
  }

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
      setMessageKind("success");
      setMessage(enabled ? "Successfully Activated" : "Successfully Deactivated");
      window.setTimeout(() => setMessage(""), 1800);
    } catch (error) {
      setMessageKind("error");
      setMessage(error.message);
    } finally {
      setBusyOption("");
    }
  }

  return (
    <section className="phone-wrap dashboard-wrap">
      <motion.div
        className="phone-shell dashboard-shell"
        style={{ "--phone-bg": `url("${settings.liveBackgroundUrl || settings.loginBackgroundUrl || "/assets/hyper-logo.jpeg"}")` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="dash-header">
          <div>
            <p>Access active</p>
            <h1>{settings.brandName}</h1>
            <div className="device-name-line">
              <span>User ID</span>
              <strong>{user.id}</strong>
              <span>Device ID</span>
              <strong>{displayDeviceId}</strong>
            </div>
          </div>
          <LiveLogo src={settings.dashboardLogoUrl} fallback={settings.appIconUrl} />
        </header>

        <div className="status-grid">
          <div className="mini-stat">
            <Package size={18} />
            <span>Package</span>
            <strong>{user.packageName || activePackage?.name}</strong>
          </div>
          <div className="mini-stat">
            <CalendarClock size={18} />
            <span>Expire</span>
            <strong>{daysLeft(user.expiresAt)}</strong>
            <small>{user.expiresAt ? `Live: ${subscriptionTime}` : subscriptionTime}</small>
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

        <div className="game-mode-card">
          <div>
            <span>Game Mode</span>
            <strong>{gameMode}</strong>
          </div>
          <div className="game-mode-selector" role="group" aria-label="Game mode selector">
            {["Free Fire", "Free Fire Max"].map((mode) => (
              <button
                type="button"
                className={gameMode === mode ? "active" : ""}
                key={mode}
                onClick={() => selectGameMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {message ? <p className={messageKind === "success" ? "success-text" : "error-text"}>{message}</p> : null}

        {showAccountInfo ? (
          <motion.div className="glass-card account-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h2>Account Info</h2>
            <div>
              <span>User ID</span>
              <strong>{user.id}</strong>
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
              <span>Live Subscription</span>
              <strong>{subscriptionTime}</strong>
            </div>
            <div>
              <span>Device ID</span>
              <strong>{displayDeviceId}</strong>
            </div>
            <div>
              <span>Device</span>
              <strong>{user.activeDevices || 0}/{user.maxDevices || 1}</strong>
            </div>
          </motion.div>
        ) : null}

        <div className="dash-actions">
          <a className="support-button" href={settings.telegramUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> Support
          </a>
          <button className="account-info-button" type="button" onClick={() => setShowAccountInfo(!showAccountInfo)}>
            <User size={16} /> Info
          </button>
          <button className="logout-button" onClick={onLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="developer-card">
          {settings.developerBannerUrl ? <img src={settings.developerBannerUrl} alt="" /> : null}
          <span>Developed by</span>
          <strong>{settings.developerName || "ESE Developer"}</strong>
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
    const adminSettings = settingsWithDefaults(settingsData.settings || settings);
    setSettings(adminSettings);
    cacheSettings(adminSettings);
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
        {tab === "logs" ? <LogsPanel token={adminToken} logs={logs} setLogs={setLogs} reload={loadAdminData} /> : null}
      </div>
    </section>
  );
}

function AdminLogin({ settings, message, onLogin, goApp }) {
  const [form, setForm] = useState({ username: "admin", password: "", remember: true });
  const [showPassword, setShowPassword] = useState(false);
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
    <section
      className="coded-login-wrap"
      style={{ "--login-bg": `url("${settings.loginBackgroundUrl || "/assets/hyper-logo.jpeg"}")` }}
    >
      <motion.div
        className="coded-login-frame admin-coded-frame"
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="coded-login-hero">
          <div className="coded-logo-mark">
            <img src="/assets/hyper-logo.jpeg" alt="" />
          </div>
          <h1>HYPER <span>REGEDIT</span></h1>
          <p>ADMIN</p>
        </div>

        <form className="coded-login-card admin-coded-card" onSubmit={submit} aria-label="Admin login">
          <div className="coded-shield">
            <ShieldCheck size={28} />
          </div>
          <h2>ADMIN PANEL</h2>
          <p className="coded-subtitle">Login with your administrator password</p>

          <label className="coded-field">
            <span>ADMIN USERNAME</span>
            <div className="coded-input-shell">
              <User size={22} />
              <input
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                placeholder="Enter admin username"
                autoComplete="username"
                aria-label="Admin Username"
              />
            </div>
          </label>

          <label className="coded-field">
            <span>ADMIN PASSWORD</span>
            <div className="coded-input-shell">
              <LockKeyhole size={21} />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter admin password"
                autoComplete="current-password"
                aria-label="Admin Password"
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
            <span>REMEMBER ADMIN</span>
          </label>

          <button className={`coded-login-button ${loading ? "coded-login-button-loading" : ""}`} disabled={loading}>
            <ShieldCheck size={22} />
            <strong>{loading ? "OPENING" : "LOGIN"}</strong>
          </button>

          {error ? <p className="coded-login-message">{error}</p> : null}

          <div className="coded-security-row">
            <span><ShieldCheck size={17} /> ADMIN ACCESS</span>
            <i />
            <span><LockKeyhole size={17} /> ENCRYPTED</span>
            <i />
            <span><ShieldCheck size={17} /> PROTECTED</span>
          </div>
        </form>

        <p className="coded-login-footer">(c) 2026 HYPER REGEDIT ACCESS - ADMIN.</p>
        <button type="button" className="coded-admin-link" onClick={goApp}>
          User App <ChevronRight size={16} />
        </button>
      </motion.div>
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
  const [form, setForm] = useState(() => ({
    password: generateAccessKey(7),
    packageName: packages[0]?.name || "Custom Access",
    expiryMode: "7",
    customExpiresAt: "",
    maxDevices: 1,
    status: "Active",
    expiresAt: ""
  }));
  const [message, setMessage] = useState("");
  const [bulkDays, setBulkDays] = useState(1);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({
    password: "",
    packageName: "",
    status: "Active",
    expiresAt: "",
    maxDevices: 1
  });

  useEffect(() => {
    if (form.packageName === "Custom Access" && packages[0]?.name) {
      setForm((current) => ({ ...current, packageName: packages[0].name }));
    }
  }, [packages]);

  function generateKeyFor(days) {
    setForm((current) => ({
      ...current,
      password: generateAccessKey(days),
      expiryMode: String(days),
      customExpiresAt: ""
    }));
  }

  async function createUser(event) {
    event.preventDefault();
    setMessage("");
    try {
      const accessKey = form.password.trim();
      const data = await api(
        "/api/admin/users",
        {
          method: "POST",
          body: JSON.stringify({
            password: accessKey,
            packageName: form.packageName,
            status: form.status,
            maxDevices: form.maxDevices,
            expiresAt: expiryFromMode(form.expiryMode, form.customExpiresAt)
          })
        },
        token
      );
      setUsers([data.user, ...users]);
      setForm({ ...form, password: generateAccessKey(Number(form.expiryMode) || 7), customExpiresAt: "", maxDevices: 1 });
      setMessage(`Access key created: ${accessKey}`);
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

  function startEditUser(user) {
    setEditingId(user.id);
    setEditForm({
      password: "",
      packageName: user.packageName,
      status: user.status,
      expiresAt: toDateInput(user.expiresAt),
      maxDevices: user.maxDevices || 1
    });
  }

  async function saveEditUser(event) {
    event.preventDefault();
    const patch = {
      packageName: editForm.packageName,
      status: editForm.status,
      expiresAt: asIsoFromInput(editForm.expiresAt),
      maxDevices: editForm.maxDevices
    };
    if (editForm.password.trim()) patch.password = editForm.password.trim();
    await updateUser(editingId, patch);
    setEditingId("");
    setEditForm({ password: "", packageName: "", status: "Active", expiresAt: "", maxDevices: 1 });
    setMessage("User updated");
  }

  async function adjustUserDays(user, delta) {
    await updateUser(user.id, { expiresAt: shiftIsoDays(user.expiresAt, delta) });
    setMessage(delta > 0 ? `Added ${delta} day(s)` : `Removed ${Math.abs(delta)} day(s)`);
  }

  async function adjustAllDays(delta) {
    const nextUsers = await Promise.all(
      users.map(async (user) => {
        const data = await api(
          `/api/admin/users/${user.id}`,
          { method: "PATCH", body: JSON.stringify({ expiresAt: shiftIsoDays(user.expiresAt, delta) }) },
          token
        );
        return data.user;
      })
    );
    setUsers(nextUsers);
    setMessage(delta > 0 ? `Added ${delta} day(s) to all users` : `Removed ${Math.abs(delta)} day(s) from all users`);
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
        <h2>Access Key Generator</h2>
        <div className="key-generator-row">
          {[1, 3, 7, 30].map((days) => (
            <button type="button" key={days} onClick={() => generateKeyFor(days)}>
              {days}D Key
            </button>
          ))}
        </div>
        <Field label="Access Key / Password">
          <input
            type="text"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="Custom key or generated key"
            required
          />
        </Field>
        <div className="generated-key-preview">
          <span>Current Generated Key</span>
          <strong>{form.password || "Generate or type a custom key"}</strong>
        </div>
        <Field label="Package Name">
          <input
            list="package-name-options"
            value={form.packageName}
            onChange={(event) => setForm({ ...form, packageName: event.target.value })}
            required
          />
          <datalist id="package-name-options">
            {packages.map((pkg) => (
              <option value={pkg.name} key={pkg.id} />
            ))}
          </datalist>
        </Field>
        <Field label="Expiry Duration">
          <select value={form.expiryMode} onChange={(event) => setForm({ ...form, expiryMode: event.target.value })}>
            <option value="1">1 Day</option>
            <option value="3">3 Days</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="custom">Custom Date</option>
          </select>
        </Field>
        {form.expiryMode === "custom" ? (
          <Field label="Custom Expire Date">
            <input
              type="datetime-local"
              value={form.customExpiresAt}
              onChange={(event) => setForm({ ...form, customExpiresAt: event.target.value })}
              required
            />
          </Field>
        ) : null}
        <Field label="Device Limit">
          <input
            type="number"
            min="1"
            value={form.maxDevices}
            onChange={(event) => setForm({ ...form, maxDevices: event.target.value })}
          />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option>Active</option>
            <option>Suspended</option>
            <option>Expired</option>
          </select>
        </Field>
        <NeonButton>
          <Plus size={17} /> Create Access Key
        </NeonButton>
        {message ? <p className="muted">{message}</p> : null}
        <div className="generated-key-list">
          <h3>Generated Keys</h3>
          {users.slice(0, 8).map((user) => (
            <div className="generated-key-row" key={user.id}>
              <strong>{user.accessKey || "Old key hidden"}</strong>
              <span className={userAccessActive(user) ? "good" : "bad"}>
                {userAccessActive(user) ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
          {!users.length ? <p className="muted">No keys created yet.</p> : null}
        </div>
      </form>

      <div className="glass-card data-card">
        <h2>Users</h2>
        <div className="bulk-tools">
          <input
            type="number"
            min="1"
            value={bulkDays}
            onChange={(event) => setBulkDays(event.target.value)}
            aria-label="Bulk days"
          />
          <button onClick={() => adjustAllDays(Number(bulkDays || 1))}>+ Days All</button>
          <button onClick={() => adjustAllDays(-Number(bulkDays || 1))}>- Days All</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Access Key</th>
                <th>Package</th>
                <th>Expire</th>
                <th>Status</th>
                <th>Device ID</th>
                <th>Devices</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.accessKey || "Old key hidden"}</td>
                  <td>{user.packageName}</td>
                  <td>{formatDate(user.expiresAt)}</td>
                  <td>
                    <span className={user.status === "Active" ? "good" : "bad"}>{user.status}</span>
                  </td>
                  <td>{user.deviceIds?.join(", ") || user.deviceId || "Not locked"}</td>
                  <td>{user.activeDevices || 0}/{user.maxDevices || 1}</td>
                  <td className="action-row">
                    <button onClick={() => adjustUserDays(user, 1)}>+1</button>
                    <button onClick={() => adjustUserDays(user, -1)}>-1</button>
                    <button onClick={() => startEditUser(user)}>
                      <Settings size={15} />
                    </button>
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
        {editingId ? (
          <form className="user-edit-panel" onSubmit={saveEditUser}>
            <h3>Edit User</h3>
            <Field label="New Access Key">
              <input
                type="text"
                value={editForm.password}
                onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                placeholder="Leave blank to keep old key"
              />
            </Field>
            <div className="key-generator-row compact">
              {[1, 3, 7, 30].map((days) => (
                <button type="button" key={days} onClick={() => setEditForm({ ...editForm, password: generateAccessKey(days) })}>
                  Generate {days}D
                </button>
              ))}
            </div>
            <Field label="Package Name">
              <input value={editForm.packageName} onChange={(event) => setEditForm({ ...editForm, packageName: event.target.value })} />
            </Field>
            <Field label="Expire Date">
              <input type="datetime-local" value={editForm.expiresAt} onChange={(event) => setEditForm({ ...editForm, expiresAt: event.target.value })} />
            </Field>
            <Field label="Device Limit">
              <input type="number" min="1" value={editForm.maxDevices} onChange={(event) => setEditForm({ ...editForm, maxDevices: event.target.value })} />
            </Field>
            <Field label="Status">
              <select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>
                <option>Active</option>
                <option>Suspended</option>
                <option>Expired</option>
              </select>
            </Field>
            <div className="edit-actions">
              <NeonButton><Save size={16} /> Save User</NeonButton>
              <button type="button" onClick={() => setEditingId("")}>Cancel</button>
            </div>
          </form>
        ) : null}
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
  const [adminPasswordForm, setAdminPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [adminPasswordMessage, setAdminPasswordMessage] = useState("");
  const profileUrl = mobileConfigUrl();

  useEffect(() => setForm(settings), [settings]);

  async function saveSettings(event) {
    event.preventDefault();
    const data = await api("/api/admin/settings", { method: "PATCH", body: JSON.stringify(form) }, token);
    const nextSettings = settingsWithDefaults(data.settings);
    setSettings(nextSettings);
    cacheSettings(nextSettings);
    setMessage("Settings saved");
    reload();
  }

  async function changeAdminPassword() {
    setAdminPasswordMessage("");
    try {
      await api("/api/admin/password", { method: "PATCH", body: JSON.stringify(adminPasswordForm) }, token);
      setAdminPasswordForm({ currentPassword: "", newPassword: "" });
      setAdminPasswordMessage("Admin password updated");
    } catch (error) {
      setAdminPasswordMessage(error.message);
    }
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
      <Field label="iPhone Home Screen Icon Name">
        <input
          value={form.webClipLabel || ""}
          onChange={(event) => setForm({ ...form, webClipLabel: event.target.value })}
          placeholder="Hyper Access"
        />
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
      <Field label="Opening Animation Image/Video URL or Data">
        <input
          value={form.splashImageUrl || ""}
          onChange={(event) => setForm({ ...form, splashImageUrl: event.target.value })}
        />
      </Field>
      <label className="upload-line">
        <Upload size={16} />
        Upload opening animation media
        <input
          type="file"
          accept="image/*,video/*"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setForm({ ...form, splashImageUrl: await fileToDataUrl(file) });
          }}
        />
      </label>
      <Field label="Opening Animation Text">
        <input
          value={form.splashText || ""}
          onChange={(event) => setForm({ ...form, splashText: event.target.value })}
        />
      </Field>
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
      <Field label="Dashboard Live Logo URL or Data">
        <input
          value={form.dashboardLogoUrl || ""}
          onChange={(event) => setForm({ ...form, dashboardLogoUrl: event.target.value })}
        />
      </Field>
      <label className="upload-line">
        <Upload size={16} />
        Upload dashboard logo/video
        <input
          type="file"
          accept="image/*,video/*"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setForm({ ...form, dashboardLogoUrl: await fileToDataUrl(file) });
          }}
        />
      </label>
      <Field label="Developer Name">
        <input
          value={form.developerName || ""}
          onChange={(event) => setForm({ ...form, developerName: event.target.value })}
        />
      </Field>
      <Field label="Developer Banner URL or Data">
        <input
          value={form.developerBannerUrl || ""}
          onChange={(event) => setForm({ ...form, developerBannerUrl: event.target.value })}
        />
      </Field>
      <label className="upload-line">
        <Upload size={16} />
        Upload developer banner
        <input
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setForm({ ...form, developerBannerUrl: await fileToDataUrl(file) });
          }}
        />
      </label>
      <Field label="User Dashboard Background URL or Data">
        <input
          value={form.liveBackgroundUrl || ""}
          onChange={(event) => setForm({ ...form, liveBackgroundUrl: event.target.value })}
        />
      </Field>
      <label className="upload-line">
        <Upload size={16} />
        Upload user dashboard background
        <input
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setForm({ ...form, liveBackgroundUrl: await fileToDataUrl(file) });
          }}
        />
      </label>
      <Field label="Telegram Support URL">
        <input value={form.telegramUrl} onChange={(event) => setForm({ ...form, telegramUrl: event.target.value })} />
      </Field>
      <Field label="Web Clip URL">
        <input value={form.webClipUrl} onChange={(event) => setForm({ ...form, webClipUrl: event.target.value })} />
      </Field>
      <div className="profile-download-box">
        <span>Dynamic iPhone Profile</span>
        <a href={profileUrl} target="_blank" rel="noreferrer">
          Download Mobile Config
        </a>
        <small>After changing icon/name, install this profile again on iPhone.</small>
      </div>
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
      <div className="admin-password-box">
        <h3>Admin Password</h3>
        <Field label="Current Admin Password">
          <input
            type="password"
            value={adminPasswordForm.currentPassword}
            onChange={(event) => setAdminPasswordForm({ ...adminPasswordForm, currentPassword: event.target.value })}
          />
        </Field>
        <Field label="New Admin Password">
          <input
            type="password"
            value={adminPasswordForm.newPassword}
            onChange={(event) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: event.target.value })}
            minLength={6}
          />
        </Field>
        <button type="button" className="ghost-button admin-password-button" onClick={changeAdminPassword}>
          <LockKeyhole size={16} /> Update Admin Password
        </button>
        {adminPasswordMessage ? <p className="muted">{adminPasswordMessage}</p> : null}
      </div>
      <NeonButton>
        <Save size={17} /> Save Settings
      </NeonButton>
      {message ? <p className="muted">{message}</p> : null}
    </form>
  );
}

function LogsPanel({ token, logs, setLogs, reload }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");
  const allSelected = logs.length > 0 && selectedIds.length === logs.length;

  function toggleLog(logId) {
    setSelectedIds((current) =>
      current.includes(logId) ? current.filter((item) => item !== logId) : [...current, logId]
    );
  }

  async function deleteSelected() {
    if (!selectedIds.length) {
      setMessage("Select logs first");
      return;
    }
    try {
      const data = await api("/api/admin/logs", { method: "DELETE", body: JSON.stringify({ ids: selectedIds }) }, token);
      setLogs(data.logs || []);
      setSelectedIds([]);
      setMessage("Selected logs deleted");
      reload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteAll() {
    try {
      const data = await api("/api/admin/logs", { method: "DELETE", body: JSON.stringify({ all: true }) }, token);
      setLogs(data.logs || []);
      setSelectedIds([]);
      setMessage("All logs deleted");
      reload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="glass-card data-card">
      <div className="log-panel-head">
        <div>
          <h2>Access Logs</h2>
          <p className="muted">{logs.length} recent records</p>
        </div>
        <div className="log-toolbar">
          <button type="button" onClick={() => setSelectedIds(allSelected ? [] : logs.map((log) => log.id))}>
            {allSelected ? "Unselect" : "Select All"}
          </button>
          <button type="button" onClick={deleteSelected} disabled={!selectedIds.length}>
            <Trash2 size={15} /> Selected Delete
          </button>
          <button type="button" className="danger-action" onClick={deleteAll} disabled={!logs.length}>
            <Trash2 size={15} /> All Delete
          </button>
        </div>
      </div>
      {message ? <p className="muted">{message}</p> : null}
      <LogTable logs={logs} selectedIds={selectedIds} onSelect={toggleLog} />
    </div>
  );
}

function LogTable({ logs, selectedIds = [], onSelect }) {
  const selectable = Boolean(onSelect);
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {selectable ? <th>Select</th> : null}
            <th>User ID</th>
            <th>Device ID</th>
            <th>Action</th>
            <th>IP Address</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              {selectable ? (
                <td>
                  <input
                    className="log-checkbox"
                    type="checkbox"
                    checked={selectedIds.includes(log.id)}
                    onChange={() => onSelect(log.id)}
                    aria-label={`Select ${log.userId || "log"}`}
                  />
                </td>
              ) : null}
              <td>{log.userId || "-"}</td>
              <td>{log.deviceId || "-"}</td>
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
