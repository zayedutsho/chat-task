"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "../../lib/api/client";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!tokenStorage.get()) {
      router.replace("/login");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Read browser storage only after hydration.
    setIsAllowed(true);
  }, [router]);

  if (!isAllowed) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white text-sm text-slate-500">
        <p role="status">Checking session...</p>
      </main>
    );
  }

  return children;
}
