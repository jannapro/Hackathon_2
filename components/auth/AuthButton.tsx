"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const { session, isPending } = useAuth();
  const router = useRouter();

  if (isPending) {
    return <span className="text-sm text-gray-400">Loading...</span>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {session.user.email}
        </span>
        <button
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Logout
        </button>
      </div>
    );
  }

  return null;
}
