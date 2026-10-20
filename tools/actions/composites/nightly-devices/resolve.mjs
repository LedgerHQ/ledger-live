#!/usr/bin/env node
/* eslint-disable no-console */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const PLATFORMS = ["desktop", "ios", "android"];

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function loadRotation(file = new URL("./rotation.json", import.meta.url)) {
  return JSON.parse(readFileSync(file, "utf8"));
}

// ISO 8601 week number, the same as `date -u +%V`.
export function isoWeek(date) {
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

export function resolveDevices(date = new Date(), rotation = loadRotation()) {
  const weekday = WEEKDAYS[date.getUTCDay()];
  const day = rotation[weekday];
  if (!day) throw new Error(`No nightly rotation for ${weekday ?? "an invalid date"}`);
  const parity = isoWeek(date) % 2 === 0 ? "evenWeek" : "oddWeek";
  return Object.fromEntries(
    PLATFORMS.map(platform => {
      const entry = day[platform];
      return [platform, typeof entry === "string" ? entry : entry[parity]];
    }),
  );
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  // Optional YYYY-MM-DD (UTC) to preview another day; defaults to now.
  const date = process.argv[2] ? new Date(`${process.argv[2]}T00:00:00Z`) : new Date();
  for (const [platform, device] of Object.entries(resolveDevices(date))) {
    console.log(`${platform}_device=${device}`);
  }
}
