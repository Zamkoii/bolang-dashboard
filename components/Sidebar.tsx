"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch, Headphones, Package, type LucideIcon } from "lucide-react";

type NavItem = { label: string; href: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { label: "Frontline AI", href: "/frontline-ai", icon: Headphones },
  { label: "SupplyMind", href: "/supplymind", icon: Package },
  { label: "DocuSync AI", href: "/docusync-ai", icon: GitBranch },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col bg-[#1E2A52]">
      {/* Logo */}
      <div className="flex h-[81px] items-start px-5 pt-[14px]">
        <span
          className="text-[46px] font-extrabold leading-[1.1] tracking-tight text-[#FACC15]"
          style={{ fontFamily: "var(--font-logo), sans-serif" }}
        >
          Bolang
        </span>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-[6px] px-5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-[66px] items-center rounded-xl pl-4 pr-3 transition-colors ${
                active ? "bg-[#2B3C6E]" : "hover:bg-white/5"
              }`}
            >
              {active && (
                <span className="mr-[11px] size-2 shrink-0 rounded-full bg-[#EF4444]" />
              )}
              <span
                className={`flex size-[38px] shrink-0 items-center justify-center rounded-[10px] ${
                  active ? "bg-[#3B5A9E]" : "bg-[#27345F]"
                }`}
              >
                <Icon
                  className={`size-[18px] ${
                    active ? "text-white" : "text-[#CBD5E1]"
                  }`}
                  strokeWidth={1.75}
                />
              </span>
              <span
                className={`text-[14px] ${
                  active
                    ? "ml-[9px] font-semibold text-white"
                    : "ml-3 font-normal text-[#E2E8F0]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Kartu dekoratif di bawah sidebar */}
      <div
        aria-hidden
        className="relative mx-5 mb-8 mt-14 min-h-[120px] flex-1 overflow-hidden bg-gradient-to-b from-[#1E3A8A] to-[#2B5FD0] [clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,0_100%)]"
      >
        <span className="absolute left-[30px] top-[52px] h-1 w-[120px] rounded-full bg-[#EAB308]" />
        <span className="absolute left-[140px] top-[60px] size-[340px] rounded-full bg-[#2563EB]/60" />
        <span className="absolute -left-[70px] top-[200px] size-[300px] rounded-full bg-[radial-gradient(circle_at_50%_85%,#4B7FE0_0%,#3366D6_45%,#2F63D3_100%)] opacity-90" />
      </div>
    </aside>
  );
}