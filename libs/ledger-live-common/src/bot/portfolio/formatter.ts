import BigNumber from "bignumber.js";
import groupBy from "lodash/groupBy";
import { findCryptoCurrencyById, formatCurrencyUnit } from "../../currencies";
import { getDefaultExplorerView, getAddressExplorer } from "../../explorers";
import { AppSpec } from "../types";
import { Report, SpecPerBot } from "./types";

function round(n?: number): number | undefined {
  if (n === undefined) return undefined;
  return Math.round(n);
}

function makeCSV(data: (number | undefined | string)[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => `"${typeof cell === "number" ? cell : cell || ""}"`)
        .join(",")
    )
    .join("\n");
}

export function csvReports(
  reports: Report[],
  specsPerBots: SpecPerBot[]
): Array<{ filename: string; content: string }> {
  const data: Datapoint[] = reports.map((report, i) => ({
    report,
    ...specsPerBots[i],
  }));
  const columns: Array<{
    label: string;
    get: (d: Datapoint) => number | string | undefined;
  }> = [
    {
      label: "seed",
      get: (d: Datapoint) => d.seed,
    },
    {
      label: "family",
      get: (d: Datapoint) => d.family,
    },
    {
      label: "coin",
      get: (d: Datapoint) => d.key,
    },
    {
      label: "Accounts count",
      get: (d: Datapoint) => d.report.accountBalances?.length,
    },
    {
      label: "Operations count",
      get: (d: Datapoint) =>
        d.report.accountOperationsLength?.reduce((a, b) => a + b, 0),
    },
    {
      label: "Sync Time (ms)",
      get: (d: Datapoint) => d.report.auditResult?.totalTime,
    },
    {
      label: "cpuUserTime (ms)",
      get: (d: Datapoint) => round(d.report.auditResult?.cpuUserTime),
    },
    {
      label: "networkBandwidth (bytes)",
      get: (d: Datapoint) => d.report.auditResult?.network.totalResponseSize,
    },
    {
      label: "networkCount",
      get: (d: Datapoint) => d.report.auditResult?.network.totalCount,
    },
    {
      label: "accountsJSONSize (bytes)",
      get: (d: Datapoint) => d.report.auditResult?.accountsJSONSize,
    },
  ];

  const csvs: Array<{ filename: string; content: string }> = [];

  csvs.push({
    filename: "csvs/all.csv",
    content: makeCSV([
      columns.map((c) => c.label),
      ...data.map((d) => columns.map((c) => c.get(d))),
    ]),
  });

  const byFamily = groupBy(data, (d) => d.family);
  for (const [family, data] of Object.entries(byFamily)) {
    csvs.push({
      filename: `csvs/by-family/${family}.csv`,
      content: makeCSV([
        columns.map((c) => c.label),
        ...data.map((d) => columns.map((c) => c.get(d))),
      ]),
    });
  }

  const byCurrency = groupBy(data, (d) => d.spec.currency.id);
  for (const [currencyId, data] of Object.entries(byCurrency)) {
    csvs.push({
      filename: `csvs/by-currency/${currencyId}.csv`,
      content: makeCSV([
        columns.map((c) => c.label),
        ...data.map((d) => columns.map((c) => c.get(d))),
      ]),
    });
  }

  return csvs;
}

export function finalMarkdownReport(
  reports: Report[],
  specsPerBots: SpecPerBot[]
): string {
  const data = reports.map((report, i) => ({ report, ...specsPerBots[i] }));
  const { table, title } = markdownHelpers(data);

  let md = "";

  md += title("Portfolio");

  md += table<Datapoint>({
    title: "Funds status",
    formatValue: (d) => {
      const { spec } = d;
      if (!spec) return;
      const viableAccounts = (d.report?.accountBalances || []).filter((b) =>
        BigNumber(b).gt(spec.minViableAmount || 0)
      ).length;
      if (viableAccounts > 0) return "✅";
      const explorerView = getDefaultExplorerView(d.spec.currency);
      const refillAddress = d.report.refillAddress || "";
      const url = !refillAddress
        ? ""
        : explorerView && refillAddress
        ? getAddressExplorer(explorerView, refillAddress)
        : "data:text," + refillAddress;
      const value = url;
      if (url) {
        return `[🙏](${url})`;
      }
      return value || "⚠️";
    },
  });

  md += table({
    title: "Balances",
    lenseValue: (d) =>
      (d.report?.accountBalances || []).reduce(
        (acc, r) => acc.plus(r),
        BigNumber(0)
      ),
    reduce: (d, map) => d.reduce((acc, r) => acc.plus(map(r)), BigNumber(0)),
    formatValue: (v, ctx) =>
      formatCurrencyUnit(ctx.spec.currency.units[0], v, { showCode: true }),
    totalPerCurrency: true,
  });

  md += table({
    title: "Accounts count",
    lenseValue: (d) => d.report?.accountBalances?.length || 0,
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  md += table({
    title: "Operations count",
    lenseValue: (d) =>
      d.report?.accountOperationsLength?.reduce((a, b) => a + b || 0, 0) || 0,
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  md += title("Performance");

  md += table({
    title: "Sync Times",
    lenseValue: (d) => d.report?.auditResult?.totalTime,
    formatValue: (v) => formatTime(v),
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  md += table({
    title: "HTTP Calls Count",
    lenseValue: (d) => d.report?.auditResult?.network?.totalCount || 0,
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  md += table({
    title: "HTTP Bandwidth",
    lenseValue: (d) => d.report?.auditResult?.network?.totalResponseSize || 0,
    formatValue: (v) => formatSize(v),
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  md += table({
    title: "Duplicate HTTP Calls",
    lenseValue: (d) =>
      d.report?.auditResult?.network?.totalDuplicateRequests || 0,
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  md += table({
    title: "Accounts Data Size",
    lenseValue: (d) => d.report?.auditResult?.accountsJSONSize,
    formatValue: (v) => formatSize(v),
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  md += table({
    title: "Currency Preloaded Data Size",
    lenseValue: (d) => d.report?.auditResult?.preloadJSONSize,
    formatValue: (v) => formatSize(v),
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  md += table({
    title: "CPU user time",
    lenseValue: (d) => d.report?.auditResult?.cpuUserTime,
    formatValue: (v) => formatTime(v),
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  /*
  md += table({
    title: "CPU system time",
    lenseValue: (d) => d.report?.auditResult?.cpuSystemTime,
    formatValue: (v) => formatTime(v),
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });
  */

  md += table({
    title: "Memory RSS",
    lenseValue: (d) => d.report?.auditResult?.memoryEnd.rss,
    formatValue: (v) => formatSize(v),
  });

  md += table({
    title: "JS Boot Time",
    lenseValue: (d) => d.report?.auditResult?.jsBootTime,
    formatValue: (v) => formatTime(v),
  });

  md += table<{ count: number; duration: number } | undefined>({
    title: "JS Slow Frames",
    reduce: (d, map) =>
      d.reduce(
        (acc, r) => ({
          count: acc.count + (map(r)?.count || 0),
          duration: acc.duration + (map(r)?.duration || 0),
        }),
        { count: 0, duration: 0 }
      ),
    lenseValue: (d) => d.report?.auditResult?.slowFrames,
    formatValue: (v) =>
      v
        ? v.count === 0
          ? "✅"
          : `${v.count} (${formatTime(v.duration)})`
        : "",
    totalPerCurrency: true,
    totalPerSeed: true,
    totalPerFamily: true,
  });

  const errors = data.filter((d) => d.report.error);
  if (errors.length) {
    md += "\n\n# Errors\n";
    const sortKey = (d) => `${d.spec.name}: ${d.report.error}`;
    md += errors
      .slice(0)
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
      .map((d) => `- ${d.seed}: ${d.spec.name}: ${d.report.error}`)
      .join("\n");
  }

  return md;
}

function formatTime(ms: number | undefined): string | undefined {
  if (!ms) return;
  const s = ms / 1000;
  return s < 9 ? `${s.toFixed(2)}s` : `${s.toFixed(0)}s`;
}

function formatSize(bytes: number | undefined): string | undefined {
  if (!bytes) return;
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)}kb` : `${(kb / 1024).toFixed(0)}mb`;
}

type Datapoint = {
  seed: string;
  env: unknown;
  spec: AppSpec<any>;
  family: string;
  key: string;
  report: Report;
};

type FormatDatapoint = (_: Datapoint) => string | number | undefined;

type FormatDatapointMulti = (_: Datapoint[]) => string | number | undefined;

type TableF = <V>(opts: {
  title: string;
  lenseValue?: (_: Datapoint) => V;
  formatValue?: (_: V, ctx: Datapoint) => string | undefined;
  reduce?: (_: Datapoint[], map: (v: Datapoint) => V) => V;
  totalPerFamily?: boolean;
  totalPerCurrency?: boolean;
  totalPerSeed?: boolean;
}) => string;

function markdownHelpers(data: Datapoint[]): {
  table: TableF;
  title: (txt: string) => string;
  strong: (txt: string) => string;
} {
  const seedNames = Array.from(new Set(data.map((d) => d.seed)));
  seedNames.sort();
  // specs are assumed to be grouped by family already
  const specs = Array.from(new Set(data.map((d) => d.spec)));

  function strong(txt: string): string {
    return "**" + txt + "**";
  }

  function title(txt: string): string {
    return "\n# " + txt + "\n\n";
  }

  function genTable(
    f: FormatDatapoint,
    opts: {
      totalPerFamily?: FormatDatapointMulti;
      totalPerCurrency?: FormatDatapointMulti;
      totalPerSeed?: FormatDatapointMulti;
    } = {}
  ): string {
    const { totalPerFamily, totalPerCurrency, totalPerSeed } = opts;
    let md = "\n\n";

    md += "| Currency |" + seedNames.join(" | ");
    if (totalPerCurrency) {
      md += "| Total ";
    }
    md += "|\n";

    md += "|--|" + Array.from(seedNames).fill("--|").join("");
    if (totalPerCurrency) {
      md += "--|";
    }
    md += "\n";

    let lastFamily = "";
    for (const spec of specs) {
      let soloInFamilyFactorisation = false;
      if (totalPerFamily && spec.currency.family !== lastFamily) {
        lastFamily = spec.currency.family;
        soloInFamilyFactorisation = !specs.some(
          (s) => s !== spec && s.currency.family === lastFamily
        );
        if (!soloInFamilyFactorisation) {
          const familyName =
            findCryptoCurrencyById(spec.currency.family)?.name ||
            spec.currency.family;
          md += "| " + strong(familyName) + " family | ";
          md += seedNames
            .map((seed) => {
              const all = data.filter(
                (d) => d.seed === seed && d.spec.currency.family === lastFamily
              );
              return (totalPerFamily(all) || "") + " |";
            })
            .join("");
          if (totalPerCurrency) {
            const all = data.filter(
              (d) => d.spec.currency.family === lastFamily
            );
            md += (totalPerCurrency(all) || "") + " |";
          }
          md += "\n";
        }
      }
      const name = spec.currency.name;
      md += "| " + (soloInFamilyFactorisation ? strong(name) : name) + " | ";
      md +=
        seedNames
          .map((seed) => {
            const d = data.find((d) => d.seed === seed && d.spec === spec);
            if (!d) return "?";
            if (d.report.error) return "❌";
            return f(d) || "";
          })
          .join(" | ") + " |";
      if (totalPerCurrency) {
        md +=
          (totalPerCurrency(data.filter((d) => d.spec === spec)) || "") + " |";
      }
      md += "\n";
    }
    if (totalPerSeed) {
      md += "| **Total** | ";
      md += seedNames
        .map((seed) => {
          const all = data.filter((d) => d.seed === seed);
          return (totalPerSeed(all) || "") + " |";
        })
        .join("");
      if (totalPerCurrency) {
        const all = data;
        md += (totalPerCurrency(all) || "") + " |";
      }
      md += "\n";
    }
    md += "\n";
    return md;
  }

  // as any is a hack to make a "defaults" that would work for most case. we will need to see how to make typing better
  const defaults = {
    lenseValue: (d: Datapoint) => d as any,
    formatValue: <V>(v: V) => String(v),
    reduce: <V>(v: Datapoint[], map: (v: Datapoint) => V): V =>
      v.reduce((sum: number, v) => sum + Number(map(v)), 0) as any,
  };

  const table: TableF = (opts) => {
    const {
      title,
      lenseValue,
      formatValue,
      totalPerFamily,
      totalPerCurrency,
      totalPerSeed,
      reduce,
    } = { ...defaults, ...opts };
    const total = (d) => formatValue(reduce(d, lenseValue), d[0]);
    let md = `\n<details><summary><b>${title}</b></summary>\n`;
    md += genTable((d) => formatValue(lenseValue(d), d), {
      totalPerFamily: totalPerFamily ? total : undefined,
      totalPerCurrency: totalPerCurrency ? total : undefined,
      totalPerSeed: totalPerSeed ? total : undefined,
    });
    md += "</details>\n\n";
    return md;
  };

  return { table, strong, title };
}
