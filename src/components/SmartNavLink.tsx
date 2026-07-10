"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SmartNavLinkProps = {
  children: ReactNode;
  className?: string;
  href: string;
};

export function SmartNavLink({ children, className, href }: SmartNavLinkProps) {
  const router = useRouter();

  function prefetch() {
    router.prefetch(href);
  }

  return (
    <Link
      className={className}
      href={href}
      prefetch={false}
      onFocus={prefetch}
      onMouseEnter={prefetch}
      onTouchStart={prefetch}
    >
      {children}
    </Link>
  );
}
