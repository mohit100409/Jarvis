import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Copy, Check, Download, Search } from "lucide-react";

interface InteractiveSortableTableProps {
  children?: React.ReactNode;
  isLight?: boolean;
  key?: React.Key;
}

export function InteractiveSortableTable({ children, isLight }: InteractiveSortableTableProps) {
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortColIndex, setSortColIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  // Parse table structure from React children
  const { headers, rows } = useMemo(() => {
    const extractedHeaders: string[] = [];
    const extractedRows: string[][] = [];

    // Helper to recursively get text from a React node
    const getNodeText = (node: any): string => {
      if (node === null || node === undefined) return "";
      if (typeof node === "string" || typeof node === "number") return String(node);
      if (Array.isArray(node)) return node.map(getNodeText).join("");
      if (node.props && node.props.children) return getNodeText(node.props.children);
      return "";
    };

    // Traverse children to locate thead/th and tbody/tr/td
    const traverse = (node: any) => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach(traverse);
        return;
      }

      if (node.type === "thead" || (node.props && node.props.className?.includes("thead"))) {
        const trs = React.Children.toArray(node.props.children);
        trs.forEach((tr: any) => {
          if (tr && tr.props && tr.props.children) {
            const ths = React.Children.toArray(tr.props.children);
            ths.forEach((th: any) => {
              extractedHeaders.push(getNodeText(th).trim());
            });
          }
        });
      } else if (node.type === "tbody" || (node.props && node.props.className?.includes("tbody"))) {
        const trs = React.Children.toArray(node.props.children);
        trs.forEach((tr: any) => {
          if (tr && tr.props && tr.props.children) {
            const tds = React.Children.toArray(tr.props.children);
            const rowData: string[] = [];
            tds.forEach((td: any) => {
              rowData.push(getNodeText(td).trim());
            });
            if (rowData.length > 0) {
              extractedRows.push(rowData);
            }
          }
        });
      } else if (node.props && node.props.children) {
        traverse(node.props.children);
      }
    };

    traverse(children);

    return { headers: extractedHeaders, rows: extractedRows };
  }, [children]);

  // Handle column header click for sorting
  const handleHeaderClick = (colIdx: number) => {
    if (sortColIndex !== colIdx) {
      setSortColIndex(colIdx);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else if (sortDirection === "desc") {
      setSortColIndex(null);
      setSortDirection(null);
    }
  };

  // Filtered & Sorted rows
  const processedRows = useMemo(() => {
    let result = [...rows];

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      result = result.filter(row => row.some(cell => cell.toLowerCase().includes(q)));
    }

    if (sortColIndex !== null && sortDirection !== null) {
      result.sort((a, b) => {
        const valA = a[sortColIndex] || "";
        const valB = b[sortColIndex] || "";

        // Check if numeric comparison is applicable
        const numA = parseFloat(valA.replace(/[^0-9.-]+/g, ""));
        const numB = parseFloat(valB.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(numA) && !isNaN(numB) && valA.match(/\d/) && valB.match(/\d/)) {
          return sortDirection === "asc" ? numA - numB : numB - numA;
        }

        return sortDirection === "asc"
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: "base" });
      });
    }

    return result;
  }, [rows, filterQuery, sortColIndex, sortDirection]);

  // Copy table as TSV/Markdown
  const handleCopyTable = async () => {
    try {
      const headerLine = headers.join("\t");
      const bodyLines = processedRows.map(row => row.join("\t")).join("\n");
      const fullText = `${headerLine}\n${bodyLines}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  // Download table as CSV
  const handleDownloadCSV = () => {
    try {
      const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;
      const headerLine = headers.map(escapeCSV).join(",");
      const bodyLines = processedRows.map(row => row.map(escapeCSV).join(",")).join("\n");
      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(`${headerLine}\n${bodyLines}`);
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute("download", `jarvis-table-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {}
  };

  // If we couldn't parse structured headers, render native children inside responsive wrapper
  if (headers.length === 0 && rows.length === 0) {
    return (
      <div className="w-full my-3 overflow-x-auto rounded-xl border border-zinc-800 bg-[#030612]/40 scrollbar-thin">
        {children}
      </div>
    );
  }

  return (
    <div
      id={`table-wrapper-${Date.now()}`}
      className={`w-full my-3 rounded-2xl border overflow-hidden transition-all text-xs font-sans select-text ${
        isLight
          ? "border-slate-200 bg-white/95 shadow-sm text-slate-800"
          : "border-zinc-800/80 bg-[#030612]/70 text-slate-200 backdrop-blur-md"
      }`}
    >
      {/* Table Toolbar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b ${
          isLight ? "border-slate-100 bg-slate-50/80" : "border-zinc-800/60 bg-white/[0.02]"
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <Search size={12} className={isLight ? "text-slate-400" : "text-cyan-400/70"} />
          <input
            type="text"
            placeholder="Filter table rows..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className={`w-full bg-transparent text-[11px] outline-none font-sans placeholder:text-[10px] ${
              isLight ? "text-slate-800 placeholder:text-slate-400" : "text-white placeholder:text-slate-500"
            }`}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyTable}
            title="Copy table to clipboard"
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
              isLight
                ? "bg-slate-200/60 hover:bg-slate-200 text-slate-700"
                : "bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/20"
            }`}
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            title="Download CSV"
            className={`p-1 rounded-lg text-[10px] transition-all cursor-pointer ${
              isLight
                ? "bg-slate-200/60 hover:bg-slate-200 text-slate-700"
                : "bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/20"
            }`}
          >
            <Download size={11} />
          </button>
        </div>
      </div>

      {/* Responsive Table Scroll Container */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-zinc-800/40 text-left border-collapse">
          {headers.length > 0 && (
            <thead>
              <tr className={isLight ? "bg-slate-100/90 text-slate-800" : "bg-black/40 text-cyan-400"}>
                {headers.map((h, colIdx) => {
                  const isSorted = sortColIndex === colIdx;
                  return (
                    <th
                      key={`th-${colIdx}`}
                      onClick={() => handleHeaderClick(colIdx)}
                      className={`px-3.5 py-2.5 text-[11px] font-black uppercase tracking-wider select-none cursor-pointer transition-colors border-b ${
                        isLight ? "border-slate-200 hover:bg-slate-200/60" : "border-zinc-800 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{h}</span>
                        <span className="shrink-0 text-[10px] opacity-70">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp size={11} className="text-cyan-400 font-bold" />
                            ) : (
                              <ArrowDown size={11} className="text-cyan-400 font-bold" />
                            )
                          ) : (
                            <ArrowUpDown size={10} className="opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}

          <tbody className={`divide-y ${isLight ? "divide-slate-100 text-slate-700" : "divide-zinc-800/40 text-slate-200"}`}>
            {processedRows.length > 0 ? (
              processedRows.map((row, rowIdx) => (
                <tr
                  key={`tr-${rowIdx}`}
                  className={`transition-colors ${
                    isLight
                      ? rowIdx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-50"
                      : rowIdx % 2 === 0 ? "bg-transparent hover:bg-white/[0.03]" : "bg-white/[0.015] hover:bg-white/[0.03]"
                  }`}
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={`td-${rowIdx}-${cIdx}`}
                      className={`px-3.5 py-2 text-[11.5px] leading-relaxed break-words max-w-[280px] sm:max-w-none border-b ${
                        isLight ? "border-slate-100" : "border-zinc-850/60"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={Math.max(headers.length, 1)}
                  className="px-4 py-6 text-center text-slate-500 font-mono text-[10px] uppercase"
                >
                  No matching rows found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Row count footer */}
      {processedRows.length > 0 && (
        <div
          className={`px-3 py-1.5 text-[9px] font-mono border-t flex justify-between items-center ${
            isLight ? "border-slate-100 bg-slate-50 text-slate-500" : "border-zinc-800/60 bg-black/20 text-slate-500"
          }`}
        >
          <span>
            Showing {processedRows.length} of {rows.length} rows
          </span>
          {sortColIndex !== null && (
            <span className="text-cyan-400">
              Sorted by "{headers[sortColIndex]}" ({sortDirection})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
