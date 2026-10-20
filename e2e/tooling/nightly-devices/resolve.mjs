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

function pickDevice(entry, week) {
  return typeof entry === "string" ? entry : entry[week % 2 === 0 ? "evenWeek" : "oddWeek"];
}

export function resolveDevices(date = new Date(), rotation = loadRotation()) {
  const day = rotation.weekdays[WEEKDAYS[date.getUTCDay()]] ?? rotation.fallback;
  const week = isoWeek(date);
  return Object.fromEntries(PLATFORMS.map(platform => [platform, pickDevice(day[platform], week)]));
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  // Optional YYYY-MM-DD (UTC) to preview another day; defaults to now.
  const dateArg = process.argv[2];
  const date = dateArg ? new Date(`${dateArg}T00:00:00Z`) : new Date();
  if (Number.isNaN(date.getTime())) {
    console.error(`Invalid date "${dateArg}", expected YYYY-MM-DD`);
    process.exit(1);
  }
  for (const [platform, device] of Object.entries(resolveDevices(date))) {
    console.log(`${platform}_device=${device}`);
  }
}
