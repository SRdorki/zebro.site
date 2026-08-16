"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWorkspace } from "@/components/providers/workspace-provider";

export function PlanGuard() {
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!activeWorkspace) return;

    // If the workspace has no plan, and we aren't already on the billing page, redirect.
    // Ensure we allow /dashboard/billing to load so they can choose a plan!
    if (activeWorkspace.plan === "none" && pathname !== "/dashboard/billing") {
      router.replace("/dashboard/billing");
    }
  }, [activeWorkspace, pathname, router]);

  return null;
}
