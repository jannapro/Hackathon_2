"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { CheckSquare, ArrowRight } from "lucide-react";

export default function Home() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, router]);

  // Initialize theme
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  if (session?.user) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0],
        });
        if (result.error) {
          setError(result.error.message || "Signup failed");
          setLoading(false);
          return;
        }
      } else {
        const result = await signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message || "Invalid credentials");
          setLoading(false);
          return;
        }
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 items-center justify-center bg-[#1e1b4b] lg:flex">
        <div className="max-w-md px-8 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500">
            <CheckSquare className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-white">TaskFlow</h2>
          <p className="text-lg text-indigo-200">
            Organize your work, boost your productivity. The modern way to manage
            tasks.
          </p>
          <div className="mt-10 space-y-4 text-left">
            {[
              "Create and organize tasks effortlessly",
              "Track progress with visual dashboards",
              "Search, filter, and manage with ease",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-indigo-200">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/50">
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <CheckSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              TaskFlow
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isSignUp
              ? "Start managing your tasks today"
              : "Sign in to continue to your dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {isSignUp && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
            >
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
