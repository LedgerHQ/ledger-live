import { writeFile } from "node:fs/promises";
import path from "node:path";
import { sleep } from "./exec.mjs";
import { MAESTRO_FLOW_TIMEOUT_MS, MAESTRO_HIERARCHY_TIMEOUT_MS } from "./maestro.mjs";

/** @import { Maestro, Platform, StartupEvent } from "./types.mjs" */

const FULL_FLOW = path.join(import.meta.dirname, "flows", "read-performance.yaml");
const QUICK_FLOW = path.join(import.meta.dirname, "flows", "read-performance-quick.yaml");
// "App startup time" is the later of these two: a read before both exist under-reports it.
const FINAL_EVENTS = ["App started", "Splash screen faded"];
const MAX_SCROLLS = 10;
// Reads of the screen after each flow, while it may still be rendering.
const SCREEN_READS = 3;
const SCREEN_READ_RETRY_MS = 2000;

/**
 * The visible strings of a `maestro hierarchy` output, in screen order.
 * @param {string} stdout
 * @returns {string[]}
 */
export function hierarchyTexts(stdout) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) return [];
  let root;
  try {
    root = JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return [];
  }
  const texts = [];
  const visit = node => {
    const attributes = node?.attributes ?? {};
    for (const key of ["text", "accessibilityText", "hintText", "value"]) {
      const value = typeof attributes[key] === "string" ? attributes[key].trim() : "";
      if (value && texts[texts.length - 1] !== value) texts.push(value);
    }
    (node?.children ?? []).forEach(visit);
  };
  visit(root);
  return texts;
}

/**
 * @param {string[]} texts
 * @returns {{ appStartupTime: number, events: Record<string, StartupEvent> } | null}
 */
export function parsePerformance(texts) {
  const joined = texts.join("\n");
  const label = "App startup time";
  const at = joined.indexOf(label);
  if (at < 0) return null;
  const after = joined.slice(at + label.length);
  const value = after.match(/(-?\d+)\s*ms\b/);
  if (!value || Number(value[1]) <= 0) return null;
  return { appStartupTime: Number(value[1]), events: parseEvents(texts) };
}

/**
 * @param {string[]} texts
 * @returns {Record<string, StartupEvent>}
 */
export function parseEvents(texts) {
  const events = {};
  for (const m of texts.join("\n").matchAll(/([^\n,]+?) \(x(\d+)\)\s*,?\s*(-?\d+)\s*ms\b/g)) {
    events[m[1].trim()] = { count: Number(m[2]), time: Number(m[3]) };
  }
  return events;
}

/**
 * Reads App startup time and the startup events from the Performance screen of the running app.
 * @param {{ platform: Platform, maestro: Maestro }} options
 */
export function createPerformanceReader({ platform: P, maestro }) {
  async function readHierarchyEvents(device) {
    const hierarchy = await maestro.invoke({
      device,
      command: "hierarchy",
      timeoutMs: MAESTRO_HIERARCHY_TIMEOUT_MS,
    });
    return parseEvents(hierarchyTexts(hierarchy.stdout));
  }

  async function readAllEvents(device, events) {
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

  async function readRemainingEvents(device, events) {
    await P.scrollToEnd(device);
    const all = { ...events, ...(await readHierarchyEvents(device)) };
    return FINAL_EVENTS.every(name => name in all) ? all : readAllEvents(device, all);
  }

  /**
   * @param {string} device
   * @param {{ quick: boolean, debugFile: string }} options
   */
  return async function readPerformance(device, { quick, debugFile }) {
    let lastTexts = [];
    let lastFlow = null;
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
      for (let i = 0; i < SCREEN_READS; i++) {
        const hierarchy = await maestro.invoke({
          device,
          command: "hierarchy",
          timeoutMs: MAESTRO_HIERARCHY_TIMEOUT_MS,
        });
        lastTexts = hierarchyTexts(hierarchy.stdout);
        const parsed = parsePerformance(lastTexts);
        if (parsed) {
          const events = await readRemainingEvents(device, parsed.events);
          const missing = FINAL_EVENTS.filter(name => !(name in events));
          if (missing.length) {
            throw new Error(
              `${missing.join(" and ")} not logged when the screen opened: App startup time would be under-reported`,
            );
          }
          return { ...parsed, events };
        }
        await sleep(SCREEN_READ_RETRY_MS);
      }
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
