"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { signIn, signUp } from "@/lib/auth-client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { session, isPending } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeField, setShakeField] = useState("");

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [isPending, session, router]);

  const shake = (field: string) => {
    setShakeField(field);
    setTimeout(() => setShakeField(""), 400);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (mode === "signup" && !name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Invalid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Minimum 8 characters";
    if (mode === "signup" && password !== confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length > 0) shake(Object.keys(errs)[0]);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await signIn.email({ email, password });
        if (res.error) {
          setErrors({ email: res.error.message ?? "Invalid credentials" });
          shake("email");
        } else {
          router.replace("/dashboard");
        }
      } else {
        const res = await signUp.email({ name, email, password });
        if (res.error) {
          setErrors({ email: res.error.message ?? "Sign up failed" });
          shake("email");
        } else {
          router.replace("/dashboard");
        }
      }
    } catch {
      setErrors({ email: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setErrors({});
    setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
  };

  if (isPending) return null;

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Gold blob — top left */}
      <div
        className="animate-blob absolute pointer-events-none"
        style={{
          top: "-180px", left: "-180px",
          width: "620px", height: "620px",
          borderRadius: "50%",
          background: "rgba(201,168,76,0.18)",
          filter: "blur(110px)",
        }}
      />
      {/* Deep gold blob — bottom right */}
      <div
        className="animate-blob-d1 absolute pointer-events-none"
        style={{
          bottom: "-180px", right: "-180px",
          width: "620px", height: "620px",
          borderRadius: "50%",
          background: "rgba(138,96,16,0.20)",
          filter: "blur(110px)",
        }}
      />
      {/* Faint gold centre pulse */}
      <div
        className="animate-blob-d2 absolute pointer-events-none"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: "420px", height: "420px",
          borderRadius: "50%",
          background: "rgba(201,168,76,0.07)",
          filter: "blur(90px)",
        }}
      />

      {/* Glass card */}
      <div
        className="glass animate-fade-in relative z-10 w-full mx-4 rounded-2xl p-8"
        style={{ maxWidth: "420px", boxShadow: "0 32px 64px rgba(0,0,0,0.4)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#8a6010,#c9a84c,#f0d060)",
              fontSize: "18px",
              animation: "logoPulse 3.5s ease-in-out infinite",
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontFamily: "var(--font-cinzel), serif",
              fontSize: "16px", fontWeight: 700, letterSpacing: "2px",
              background: "linear-gradient(135deg,#c9a84c,#f0d060,#c9a84c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            TaskFlow
          </span>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            {mode === "login"
              ? "Sign in to your TaskFlow account"
              : "Start managing tasks with AI assistance"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Name (signup only) */}
          {mode === "signup" && (
            <div className={shakeField === "name" ? "animate-shake" : ""}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>
                Full Name
              </label>
              <input
                className={`input-base ${errors.name ? "error" : ""}`}
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1 text-xs" style={{ color: "#EF4444" }}>{errors.name}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div className={shakeField === "email" ? "animate-shake" : ""}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>
              Email
            </label>
            <input
              className={`input-base ${errors.email ? "error" : ""}`}
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-xs" style={{ color: "#EF4444" }}>{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className={shakeField === "password" ? "animate-shake" : ""}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                className={`input-base ${errors.password ? "error" : ""}`}
                style={{ paddingRight: "40px" }}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)", color: "var(--text3)",
                  background: "none", border: "none", cursor: "pointer",
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: "#EF4444" }}>{errors.password}</p>
            )}
          </div>

          {/* Confirm password (signup only) */}
          {mode === "signup" && (
            <div className={shakeField === "confirmPassword" ? "animate-shake" : ""}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className={`input-base ${errors.confirmPassword ? "error" : ""}`}
                  style={{ paddingRight: "40px" }}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)", color: "var(--text3)",
                    background: "none", border: "none", cursor: "pointer",
                  }}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs" style={{ color: "#EF4444" }}>{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-gold font-display flex items-center justify-center gap-2"
            style={{ width: "100%", padding: "12px", borderRadius: "10px", fontSize: "9px", letterSpacing: "1.5px" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {mode === "login" ? "Signing in…" : "Creating account…"}
              </>
            ) : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {/* Toggle */}
        <p className="mt-6 text-center text-sm" style={{ color: "var(--text2)" }}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={switchMode}
            style={{ color: "var(--gold)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
