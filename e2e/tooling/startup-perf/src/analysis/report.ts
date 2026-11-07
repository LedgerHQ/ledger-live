// The job summary: B − A per platform, scenario and measure, and what the rows mean.
import type { DebugBase, GateOptions, Row } from "./analyze.ts";
import type { Side } from "../types.ts";

export interface ReportOptions extends GateOptions {
  labelA: string;
  labelB: string;
}

const SIDES: Side[] = ["A", "B"];

const gateRule = (thresholdMs: number) =>
  `B fails when it is slower than A by more than ${thresholdMs} ms on either measure.`;
const PRESET_RULES: Partial<Record<string, (thresholdMs: number) => string>> = {
  "prod-vs-release": gateRule,
  custom: gateRule,
  "known-regression": t =>
    `B is A with LIVE-36190 re-added: it is detected when it is slower than A by more than ${t} ms, as the gate would fail it.`,
};

const BASE_TEXT: Record<DebugBase, string> = {
  js: "the first JS import",
  process: "the process start",
};
const baseText = (base: DebugBase | null) => (base ? BASE_TEXT[base] : "an unknown start");

const fmt = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? String(Math.round(v)) : "–";
const signed = (v: number | null | undefined) => {
  if (typeof v !== "number" || !Number.isFinite(v)) return "–";
  const sign = v > 0 ? "+" : "";
  return `${sign}${Math.round(v)}`;
};

export function toMarkdown(
  rows: Row[],
  { preset, labelA, labelB, thresholdMs }: ReportOptions,
): string {
  const lines = [
    `### Startup time, ${preset}: B − A`,
    "",
    `A = ${labelA} · B = ${labelB}.`,
    PRESET_RULES[preset]?.(thresholdMs) ?? "",
    "",
    "| Platform | Scenario | Measure | Pairs | Median A (ms) | Median B (ms) | B − A (ms) | 95% interval (ms) | Mean B − A (ms) | Flags a slowdown of (ms) | Spread of B − A (ms) | Device bias (ms) | Failed launches | Verdict |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    const interval =
      r.hl?.low === null || !r.hl ? "–" : `${signed(r.hl.low)} to ${signed(r.hl.high)}`;
    const mean = r.mean
      ? `${signed(r.mean.estimate)} (${signed(r.mean.low)} to ${signed(r.mean.high)})`
      : "–";
    lines.push(
      `| ${r.platform} | ${r.scenario} | ${r.measure} | ${r.pairs} | ${fmt(r.medianA)} | ${fmt(r.medianB)} | ${signed(r.hl?.estimate)} | ${interval} | ${mean} | ${fmt(r.detectable)} | ${fmt(r.spread)} | ${signed(r.instanceBias)} | ${r.failed}/${r.launches} | ${r.verdict} |`,
    );
  }
  lines.push(
    "",
    "- **Debug screen**: Settings > Debug > Performance > App startup time. Builds count it from the first JS import (4.26–4.27) or from the app process start (LIVE-40286 on).",
    "- **With native start**: the same end, counted from the start of the app process (the emulator's or the host's kernel) whatever the build's Debug value counts from, so builds of every version compare. It equals the Debug value of builds that count from the process start (within about 20 ms).",
    "",
    "B − A is the Hodges–Lehmann median of the paired differences, after removing the device bias: how much slower the second emulator or simulator is than the first, measured thanks to the halfway swap.",
    `The mean (with a bootstrap 95% interval) is what the manual test compares. "Flags a slowdown of" is the true B − A the ${thresholdMs} ms gate catches 80% of the time at this noise; a true ${thresholdMs} ms is caught half the time.`,
    ...rows
      .filter(r => r.startsDiffer && r.measure.startsWith("Debug screen"))
      .map(
        r =>
          `**${r.platform} ${r.scenario}: A's Debug value counts from ${baseText(r.bases.A)} and B's from ${baseText(r.bases.B)}, so the Debug screen row compares the time from the first JS import.**`,
      ),
    ...rows
      .filter(r => r.measure.startsWith("Debug screen"))
      .flatMap(r =>
        SIDES.filter(side => r.offBaseLaunches[side] > 0).map(
          side =>
            `**${r.platform} ${r.scenario}: ${r.offBaseLaunches[side]} launch(es) of build ${side} counted from another start than ${baseText(r.bases[side])} (e.g. the app found no process start) and are left out of the Debug screen row.**`,
        ),
      ),
    "",
  );
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n");
}
