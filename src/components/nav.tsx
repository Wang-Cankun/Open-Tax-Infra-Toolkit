"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getAllAreas } from "@/lib/areas/registry";

export default function Nav() {
  const path = usePathname();
  const [areasOpen, setAreasOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const areas = getAllAreas();

  const overviewActive = path === "/";
  const areasActive = path?.startsWith("/areas/") ?? false;
  const grantsActive = path === "/federal-grants";
  const enforcementActive = path === "/enforcement";
  const diagramActive = path === "/overview";
  const aboutActive = path === "/about";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAreasOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAreasOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur border-b border-rule">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-2 h-2 rounded-full bg-navy group-hover:bg-teal transition-colors" />
          <span className="font-display text-lg font-semibold text-navy tracking-tight">
            GAAP Tracker
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              overviewActive
                ? "bg-navy-light text-navy"
                : "text-ink-muted hover:text-ink hover:bg-gray-100"
            }`}
          >
            Overview
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setAreasOpen((prev) => !prev)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                areasActive
                  ? "bg-navy-light text-navy"
                  : "text-ink-muted hover:text-ink hover:bg-gray-100"
              }`}
            >
              Areas
            </button>

            {areasOpen && (
              <div className="absolute top-full mt-1 left-0 w-56 bg-surface border border-rule rounded-lg shadow-lg py-2 z-50">
                {areas.map((area) => (
                  <Link
                    key={area.slug}
                    href={`/areas/${area.slug}`}
                    onClick={() => setAreasOpen(false)}
                    className="block px-4 py-2 text-sm text-ink-muted hover:bg-gray-50 hover:text-ink transition-colors"
                  >
                    {area.shortName}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/federal-grants"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              grantsActive
                ? "bg-navy-light text-navy"
                : "text-ink-muted hover:text-ink hover:bg-gray-100"
            }`}
          >
            Grants
          </Link>

          <Link
            href="/enforcement"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              enforcementActive
                ? "bg-navy-light text-navy"
                : "text-ink-muted hover:text-ink hover:bg-gray-100"
            }`}
          >
            Enforcement
          </Link>

          <Link
            href="/overview"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              diagramActive
                ? "bg-navy-light text-navy"
                : "text-ink-muted hover:text-ink hover:bg-gray-100"
            }`}
          >
            Diagram
          </Link>

          <Link
            href="/about"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              aboutActive
                ? "bg-navy-light text-navy"
                : "text-ink-muted hover:text-ink hover:bg-gray-100"
            }`}
          >
            About
          </Link>
        </nav>

        <a
          href="https://github.com/placeholder/gaap-tracker"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-faint hover:text-ink transition-colors"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
