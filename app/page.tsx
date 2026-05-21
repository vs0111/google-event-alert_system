"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

// Google Icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"
    />
    <path
      fill="#34A853"
      d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"
    />
    <path
      fill="#FBBC05"
      d="M4.5 10.48A4.8 4.8 0 014.5 7.52V5.45H1.83a8 8 0 000 7.1L4.5 10.48z"
    />
    <path
      fill="#EA4335"
      d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.45L4.5 7.52a4.77 4.77 0 014.48-3.34z"
    />
  </svg>
);

// Bell icon for the app logo
const BellIcon = () => (
  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 9H18.01"
    />
  </svg>
);

interface CalendarEvent {
  id: string;
  summary: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
}

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 India (+91)" },
  { code: "+1", label: "🇺🇸 USA (+1)" },
  { code: "+44", label: "🇬🇧 UK (+44)" },
  { code: "+61", label: "🇦🇺 Australia (+61)" },
  { code: "+65", label: "🇸🇬 Singapore (+65)" },
  { code: "+971", label: "🇦🇪 UAE (+971)" },
  { code: "+49", label: "🇩🇪 Germany (+49)" },
];

export default function Home() {
  const { data: session } = useSession();

  // Phone input states
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Validation & status states
  const [validationError, setValidationError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testCalling, setTestCalling] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Calendar event list states
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [remindedEvents, setRemindedEvents] = useState<string[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState("");

  // Helper to parse stored phone number
  const parsePhoneNumber = (fullPhone: string) => {
    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const item of sortedCodes) {
      if (fullPhone.startsWith(item.code)) {
        return {
          countryCode: item.code,
          number: fullPhone.substring(item.code.length)
        };
      }
    }
    return { countryCode: "+91", number: fullPhone };
  };

  // Fetch calendar events and phone data from DB
  const fetchData = async () => {
    if (!session) return;
    setLoadingEvents(true);
    setEventsError("");
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents(data.events || []);
        setRemindedEvents(data.remindedEvents || []);
        
        // Parse DB phone number into countryCode and phoneNumber
        if (data.phone) {
          const parsed = parsePhoneNumber(data.phone);
          setCountryCode(parsed.countryCode);
          setPhoneNumber(parsed.number);
        }
      } else {
        setEventsError(data.message || "Failed to load events.");
      }
    } catch {
      setEventsError("Unable to connect to calendar events service.");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // 10-digit numerical constraint validator
  const handlePhoneChange = (val: string) => {
    // Better validation: ensure only numbers
    const clean = val.replace(/\D/g, "");
    const truncated = clean.slice(0, 10);
    setPhoneNumber(truncated);
    if (truncated.length > 0 && truncated.length < 10) {
      setValidationError("Phone number must be exactly 10 digits");
    } else {
      setValidationError("");
    }
  };

  const validateInputs = () => {
    if (!phoneNumber) {
      setValidationError("Phone number is required");
      return false;
    }
    if (phoneNumber.length !== 10) {
      setValidationError("Phone number must be exactly 10 digits");
      return false;
    }
    return true;
  };

  const savePhone = async () => {
    if (!validateInputs()) return;

    setSaving(true);
    setValidationError("");
    setSaved(false);

    const fullPhone = `${countryCode}${phoneNumber}`;

    try {
      const res = await fetch("/api/save-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email, phone: fullPhone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setValidationError(data.message || "Could not save phone number.");
      }
    } catch {
      setValidationError("Network error — please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const triggerTestCall = async () => {
    setTestCalling(true);
    setTestMessage(null);

    try {
      const res = await fetch("/api/call", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTestMessage({ type: "success", text: data.message });
      } else {
        setTestMessage({ type: "error", text: data.message || "Call trigger failed." });
      }
    } catch {
      setTestMessage({ type: "error", text: "Network error trying to trigger call." });
    } finally {
      setTestCalling(false);
    }
  };

  const calledEvents = events.filter(e => remindedEvents.includes(e.id));
  const upcomingEvents = events.filter(e => !remindedEvents.includes(e.id));

  const formatTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return "All Day";
    const d = new Date(dateTimeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (dateTimeStr?: string) => {
    if (!dateTimeStr) return "";
    const d = new Date(dateTimeStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      
      {!session ? (
        /* ── Login screen ── */
        <div className="w-full max-w-sm fade-in relative z-10">
          {/* Branding */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)] bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <BellIcon />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Calendar Alerts
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Never miss a meeting &mdash; we&apos;ll call you when it&apos;s time.
            </p>
          </div>

          {/* Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-800">
            <p className="text-sm text-slate-400 text-center mb-6">
              Sign in to connect your Google Calendar
            </p>

            <button
              id="google-signin-btn"
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-[0.98] cursor-pointer"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-xs text-slate-500 text-center mt-6 leading-relaxed">
              We only read upcoming events.
            </p>
          </div>
        </div>
      ) : (
        /* ── Dashboard Screen ── */
        <div className="w-full max-w-[28rem] lg:max-w-5xl fade-in flex flex-col gap-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full">
            {/* Main User Settings Card */}
            <div className="flex-1 w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative">
            {/* Header banner */}
            <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-white/5 relative">
              <div className="absolute top-4 right-4">
                <button
                  id="signout-btn"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/5"
                >
                  Sign out
                </button>
              </div>
              <div className="flex items-center gap-4">
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User avatar"}
                    className="w-14 h-14 rounded-full ring-2 ring-indigo-500/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl ring-2 ring-indigo-500/30">
                    {session.user?.name?.charAt(0) ?? "U"}
                  </div>
                )}
                <div className="min-w-0 pr-12">
                  <p className="text-white font-bold text-lg leading-tight truncate">
                    Hi, {session.user?.name?.split(" ")[0] ?? "there"}! 👋
                  </p>
                  <p className="text-indigo-300/80 text-sm mt-1 truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Phone number config */}
            <div className="px-8 py-7">
              <label
                htmlFor="phone-input"
                className="block text-sm font-semibold text-slate-300 mb-2"
              >
                Your phone number
              </label>

              <div className="flex rounded-xl border border-slate-700 bg-slate-950/50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all shadow-inner">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-transparent border-r border-slate-700 px-4 text-sm font-semibold text-slate-300 focus:outline-none cursor-pointer appearance-none hover:bg-white/5 transition-colors"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code} className="bg-slate-900 text-slate-300">
                      {item.code}
                    </option>
                  ))}
                </select>
                <input
                  id="phone-input"
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-4 py-3.5 text-sm text-white bg-transparent focus:outline-none placeholder-slate-600 font-medium tracking-wider"
                />
              </div>

              {/* Validation Feedback Messages */}
              {validationError && (
                <p className="text-xs text-red-400 mt-2.5 font-medium flex items-center gap-1.5 bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
                  <span className="text-base">⚠️</span> {validationError}
                </p>
              )}

              {phoneNumber.length === 10 && (
                <p className="text-xs text-emerald-400 mt-2.5 font-semibold flex items-center gap-1.5 bg-emerald-400/10 px-3 py-2 rounded-lg border border-emerald-400/20">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Valid 10-digit number
                </p>
              )}

              <p className="text-xs text-slate-500 mt-4 leading-relaxed bg-white/5 p-3 rounded-lg">
                <span className="text-indigo-400 font-semibold mr-1">ℹ️</span> We&apos;ll call you 5 minutes before any upcoming calendar event.
              </p>

              <button
                id="save-phone-btn"
                onClick={savePhone}
                disabled={saving || phoneNumber.length !== 10}
                className={`w-full mt-5 rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.5)] active:scale-[0.98] cursor-pointer ${
                  phoneNumber.length !== 10 ? 'opacity-50 cursor-not-allowed shadow-none' : ''
                }`}
                style={{
                  background: saved
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                }}
              >
                {saving ? "Saving…" : saved ? "✓ Saved Successfully!" : "Save phone number"}
              </button>

              {/* Instant twilio call diagnostic */}
              {phoneNumber.length === 10 && (
                <div className="mt-5 pt-5 border-t border-slate-800">
                  <button
                    onClick={triggerTestCall}
                    disabled={testCalling}
                    className="w-full flex items-center justify-center gap-2 border border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 text-xs font-semibold py-3 px-4 rounded-xl transition-all bg-slate-800/50 hover:bg-indigo-500/10 cursor-pointer"
                  >
                    {testCalling ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Triggering call...
                      </span>
                    ) : "📞 Trigger instant test call"}
                  </button>

                  {testMessage && (
                    <div
                      className={`mt-3 p-3 rounded-xl text-xs font-medium leading-relaxed border flex items-start gap-2 ${
                        testMessage.type === "success"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      <span className="text-base mt-[-2px]">{testMessage.type === "success" ? "✓" : "⚠️"}</span>
                      {testMessage.text}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>

            {/* Calendar Alerts & Called History Monitor Card */}
            <div className="flex-1 w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl p-7 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
                  <span className="text-indigo-400">📅</span> Alert Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-1">Google Calendar status</p>
              </div>

              <button
                onClick={fetchData}
                disabled={loadingEvents}
                className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 transition-all text-slate-300 cursor-pointer"
                title="Refresh calendar events"
              >
                <RefreshIcon className={`w-4 h-4 ${loadingEvents ? "animate-spin text-indigo-400" : ""}`} />
              </button>
            </div>

            {eventsError && (
               <div className="bg-red-500/10 text-red-400 text-xs p-4 rounded-xl mb-5 leading-relaxed border border-red-500/20">
                <span className="text-base mr-1">⚠️</span> {eventsError}
              </div>
            )}

            {loadingEvents && events.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <svg className="animate-spin h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs font-medium">Syncing latest calendar items...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
                  <span className="text-2xl">🍃</span>
                </div>
                <p className="font-bold text-sm text-slate-200 mb-1">No events scheduled</p>
                <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                  You have no upcoming meetings in the next 7 days.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Upcoming Events */}
                {upcomingEvents.length > 0 ? (
                  <div>
                    <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Upcoming Scheduled
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1 pb-3">
                      {upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 transition-colors rounded-2xl p-4 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <span className="inline-block text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md mb-2 border border-indigo-500/20">
                              {formatDateLabel(event.start?.dateTime || event.start?.date)}
                            </span>
                            <h5 className="font-semibold text-white text-sm leading-snug truncate max-w-[190px]">
                              {event.summary || "Untitled Event"}
                            </h5>
                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                              <span className="text-[10px]">🕒</span> {formatTime(event.start?.dateTime)}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Ready
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                      Upcoming Scheduled
                    </h4>
                    <div className="bg-slate-800/30 border border-slate-700/50 border-dashed rounded-2xl p-4 text-center">
                      <p className="text-xs text-slate-500">No upcoming calls scheduled.</p>
                    </div>
                  </div>
                )}

                {/* Triggered Calls History */}
                {calledEvents.length > 0 ? (
                  <div className="pt-2">
                    <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Event Call History
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1 pb-3">
                      {calledEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-emerald-900/10 border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0 opacity-80">
                            <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md mb-2">
                              {formatDateLabel(event.start?.dateTime || event.start?.date)}
                            </span>
                            <h5 className="font-semibold text-slate-300 text-sm leading-snug truncate max-w-[190px] line-through decoration-emerald-500/50">
                              {event.summary || "Untitled Event"}
                            </h5>
                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                              <span className="text-[10px]">✓</span> Called at {formatTime(event.start?.dateTime)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                      Event Call History
                    </h4>
                    <div className="bg-slate-800/30 border border-slate-700/50 border-dashed rounded-2xl p-4 text-center">
                      <p className="text-xs text-slate-500">No call history details available.</p>
                    </div>
                  </div>
                )}

              </div>
            )}
            </div>
          </div>

          {showSignOutConfirm && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl fade-in text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Sign Out</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Are you sure you want to sign out of your account? You will need to sign in again to receive calendar alerts.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-sm font-semibold transition-all bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSignOutConfirm(false);
                      signOut();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-bold transition-all shadow-[0_4px_15px_rgba(239,68,68,0.3)] active:scale-[0.98] cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}