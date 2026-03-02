"use client";

import { usePathname } from "next/navigation";

export default function GlobalHeader() {
  const pathname = usePathname();
  const isAccountRoute = pathname.startsWith("/account");

  if (isAccountRoute) {
    return null;
  }

  return <div>header</div>;
}
