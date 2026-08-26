"use client";

import { useState } from "react";

interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
  mono?: boolean;
  // format removed — pre-format data in server component before passing
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  searchKey?: string;
  searchPlaceholder?: string;
  maxRows?: number;
}

export default function DataTable({
  columns,
  rows,
  searchKey,
  searchPlaceholder = "Search...",
  maxRows = 50,
}: DataTableProps) {
  const [query, setQuery] = useState("");

  const filtered = searchKey && query
    ? rows.filter((r) =>
        String(r[searchKey] ?? "")
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : rows;

  const display = filtered.slice(0, maxRows);

  return (
    <div>
      {searchKey && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="mb-4 w-full max-w-sm px-3 py-2 text-sm border border-rule rounded-md bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-navy-light focus:border-navy"
        />
      )}
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-rule">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-semibold text-xs uppercase tracking-wider text-ink-muted ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((row, i) => (
              <tr key={i} className="data-row border-b border-rule/50 last:border-0">
                {columns.map((col) => {
                  const raw = row[col.key];
                  const val = String(raw ?? "");
                  return (
                    <td
                      key={col.key}
                      className={`py-2.5 px-4 ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${col.mono ? "font-mono text-ink-muted" : ""}`}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Showing {display.length.toLocaleString()} of{" "}
        {filtered.length.toLocaleString()} results.
        {filtered.length < rows.length && ` (${rows.length.toLocaleString()} total)`}
      </p>
    </div>
  );
}
