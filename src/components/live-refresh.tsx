"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const events = new EventSource("/api/local-events");
    events.onmessage = () => { if (document.visibilityState === "visible") router.refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") router.refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { events.close(); document.removeEventListener("visibilitychange", onVisible); };
  }, [router]);
  return null;
}
