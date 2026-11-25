// The job summary: B − A per platform and scenario, and what the rows mean.
import type { GateOptions, Row } from "./analyze.ts";
import type { Side } from "../types.ts";

export interface ReportOptions extends GateOptions {
  labelA: string;
  labelB: string;
}

const SIDES: Side[] = ["A", "B"];

// As in analyze.ts's verdicts: every preset but these two gates B against A.
const PRESET_RULES: Partial<Record<string, (thresholdMs: number) => string>> = {
  "aa-noise": () => "",
  "known-regression": t =>
    `B is A with LIVE-36190 re-added: it is detected when it is slower than A by more than ${t} ms, as the gate would fail it.`,
};
const gateRule = (thresholdMs: number) =>
  `B fails when it is slower than A by more than ${thresholdMs} ms.`;

const jsStartNote = (r: Row, side: Side): string =>
  `**${r.platform} ${r.scenario}: ${r.jsStartLaunches[side]} launch(es) of build ${side} counted from the first JS import, not the process start (the app found none), and are left out.**`;

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
    (PRESET_RULES[preset] ?? gateRule)(thresholdMs),
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
    "- **Debug screen**: Settings > Debug > Performance > App startup time, counted from the app process start (LIVE-40286), which the app also writes to the device log as soon as the startup is over (#24576, from 4.29 on): the measurement reads it there, and a launch whose lines never come or cannot be read fails.",
    "",
    "B − A is the Hodges–Lehmann median of the paired differences, after removing the device bias: how much slower the second emulator or simulator is than the first, measured thanks to the halfway swap.",
    `The mean (with a bootstrap 95% interval) is what the manual test compares. "Flags a slowdown of" is the true B − A the ${thresholdMs} ms gate catches 80% of the time at this noise; a true ${thresholdMs} ms is caught half the time.`,
    ...rows.flatMap(r =>
      SIDES.filter(side => r.jsStartLaunches[side] > 0).map(side => jsStartNote(r, side)),
    ),
    "",
  );
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n");
}
