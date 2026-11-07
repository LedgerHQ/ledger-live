import { writeFile } from "node:fs/promises";
import path from "node:path";
import { sleep } from "./exec.ts";
import { FLOWS_DIR, MAESTRO_FLOW_TIMEOUT_MS, MAESTRO_HIERARCHY_TIMEOUT_MS } from "./maestro.ts";
import type { StartupEvent } from "../types.ts";
import type { Maestro, Platform, RunResult } from "./types.ts";

const FULL_FLOW = path.join(FLOWS_DIR, "read-performance.yaml");
const QUICK_FLOW = path.join(FLOWS_DIR, "read-performance-quick.yaml");
// "App startup time" is the later of these two: a read before both exist under-reports it.
const FINAL_EVENTS = ["App started", "Splash screen faded"];
const MAX_SCROLLS = 10;
// Reads of the screen after each flow, while it may still be rendering.
const SCREEN_READS = 3;
const SCREEN_READ_RETRY_MS = 2000;

type StartupEvents = Record<string, StartupEvent>;

export interface PerformanceRead {
  appStartupTime: number;
  events: StartupEvents;
}

/** A node of `maestro hierarchy`'s JSON output. */
interface HierarchyNode {
  attributes?: Record<string, unknown>;
  children?: HierarchyNode[];
}

/** The visible strings of a `maestro hierarchy` output, in screen order. */
export function hierarchyTexts(stdout: string): string[] {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) return [];
  let root: HierarchyNode;
  try {
    root = JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return [];
  }
  const texts: string[] = [];
  const visit = (node: HierarchyNode | null | undefined) => {
    const attributes = node?.attributes ?? {};
    for (const key of ["text", "accessibilityText", "hintText", "value"]) {
      const attribute = attributes[key];
      const value = typeof attribute === "string" ? attribute.trim() : "";
      if (value && texts.at(-1) !== value) texts.push(value);
    }
    (node?.children ?? []).forEach(visit);
  };
  visit(root);
  return texts;
}

export function parsePerformance(texts: string[]): PerformanceRead | null {
  const joined = texts.join("\n");
  const label = "App startup time";
  const at = joined.indexOf(label);
  if (at < 0) return null;
  const after = joined.slice(at + label.length);
  const value = /(?<![\d-])(-?\d+)\s*ms\b/.exec(after);
  if (!value || Number(value[1]) <= 0) return null;
  return { appStartupTime: Number(value[1]), events: parseEvents(texts) };
}

// "<name> (x<count>)" then "<time> ms", in one text after a comma or in the next one. A name starts
// after a newline or a comma, so the scan stays linear.
const EVENT_ROW = /(?<![^\n,])([^\n,]+?) \(x(\d+)\)\s*(?:,\s*)?(-?\d+)\s*ms\b/g;

export function parseEvents(texts: string[]): StartupEvents {
  const events: StartupEvents = {};
  for (const m of texts.join("\n").matchAll(EVENT_ROW)) {
    events[m[1].trim()] = { count: Number(m[2]), time: Number(m[3]) };
  }
  return events;
}

/** Reads App startup time and the startup events from the Performance screen of the running app. */
export function createPerformanceReader({
  platform: P,
  maestro,
}: {
  platform: Platform;
  maestro: Maestro;
}) {
  async function readHierarchyEvents(device: string): Promise<StartupEvents> {
    const hierarchy = await maestro.invoke({
      device,
      command: "hierarchy",
      timeoutMs: MAESTRO_HIERARCHY_TIMEOUT_MS,
    });
    return parseEvents(hierarchyTexts(hierarchy.stdout));
  }

  async function readAllEvents(device: string, events: StartupEvents): Promise<StartupEvents> {
    const all = { ...events };
    for (let i = 0; i < MAX_SCROLLS; i++) {
      await P.scrollDown(device);
      const found = Object.entries(await readHierarchyEvents(device)).filter(
        ([name]) => !(name in all),
      );
      if (!found.length) break;
      for (const [name, event] of found) all[name] = event;
    }
    return all;
  }

  async function readRemainingEvents(
    device: string,
    events: StartupEvents,
  ): Promise<StartupEvents> {
    await P.scrollToEnd(device);
    const all = { ...events, ...(await readHierarchyEvents(device)) };
    return FINAL_EVENTS.every(name => name in all) ? all : readAllEvents(device, all);
  }

  /** Reads the screen a few times while it renders; `read` is null when the value never shows. */
  async function readScreen(
    device: string,
  ): Promise<{ read: PerformanceRead | null; texts: string[] }> {
    let texts: string[] = [];
    for (let i = 0; i < SCREEN_READS; i++) {
      const hierarchy = await maestro.invoke({
        device,
        command: "hierarchy",
        timeoutMs: MAESTRO_HIERARCHY_TIMEOUT_MS,
      });
      texts = hierarchyTexts(hierarchy.stdout);
      const read = parsePerformance(texts);
      if (read) return { read, texts };
      await sleep(SCREEN_READ_RETRY_MS);
    }
    return { read: null, texts };
  }

  async function withAllEvents(device: string, read: PerformanceRead): Promise<PerformanceRead> {
    const events = await readRemainingEvents(device, read.events);
    const missing = FINAL_EVENTS.filter(name => !(name in events));
    if (missing.length) {
      throw new Error(
        `${missing.join(" and ")} not logged when the screen opened: App startup time would be under-reported`,
      );
    }
    return { ...read, events };
  }

  return async function readPerformance(
    device: string,
    { quick, debugFile }: { quick: boolean; debugFile: string },
  ): Promise<PerformanceRead> {
    let lastTexts: string[] = [];
    let lastFlow: RunResult | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const flow = quick && attempt === 1 ? QUICK_FLOW : FULL_FLOW;
      // A driver stuck on an abandoned call would otherwise serve the retry too.
      if (attempt === 2) await P.stopDriver(device);
      lastFlow = await maestro.invoke({
        device,
        command: "test",
        args: [flow],
        timeoutMs: MAESTRO_FLOW_TIMEOUT_MS,
      });
      const screen = await readScreen(device);
      lastTexts = screen.texts;
      if (screen.read) return withAllEvents(device, screen.read);
      const dialog = await P.blockingDialog(device);
      if (dialog) {
        lastTexts.unshift(`(dialog from ${dialog} has the focus)`);
        break;
      }
    }
    await writeFile(
      debugFile,
      `--- maestro test stdout\n${lastFlow?.stdout}\n--- stderr\n${lastFlow?.stderr}\n--- screen texts\n${lastTexts.join("\n")}\n`,
    );
    throw new Error("could not read App startup time from the Performance screen");
  };
}
