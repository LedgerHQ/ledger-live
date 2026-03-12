import { allure } from "jest-allure2-reporter/api";

const stderrChunks: string[] = [];
const originalStderrWrite = process.stderr.write.bind(process.stderr);

type WriteCallback = (err?: Error | null) => void;

function captureStderr(chunk: string | Uint8Array, callback?: WriteCallback): boolean;
function captureStderr(
  chunk: string | Uint8Array,
  encoding?: BufferEncoding,
  callback?: WriteCallback,
): boolean;
function captureStderr(
  chunk: string | Uint8Array,
  encodingOrCallback?: BufferEncoding | WriteCallback,
  callback?: WriteCallback,
): boolean {
  stderrChunks.push(typeof chunk === "string" ? chunk : chunk.toString());
  if (typeof encodingOrCallback === "function") {
    return originalStderrWrite(chunk, encodingOrCallback);
  }
  return originalStderrWrite(chunk, encodingOrCallback, callback);
}

export function installConsoleCapture(): void {
  process.stderr.write = captureStderr;
}

export function resetStderrCaptureForCurrentTest(): void {
  stderrChunks.length = 0;
}

export function getCapturedStderr(): string {
  return stderrChunks.join("");
}

/**
 * Attach test execution stderr to Allure.
 * If a Speculos failure stored stderr in global (e.g. during beforeAll),
 * uses that snapshot so it appears in the Test body; otherwise uses live capture.
 */
export async function attachTestExecutionConsoleToAllure(): Promise<void> {
  const stderrText =
    globalThis.speculosFailureStderr !== undefined
      ? globalThis.speculosFailureStderr
      : getCapturedStderr();
  if (globalThis.speculosFailureStderr !== undefined) {
    globalThis.speculosFailureStderr = undefined;
  }
  if (stderrText.trim() !== "")
    await allure.attachment("Test execution stderr", stderrText.trim(), "text/plain");
}

export async function attachSpeculosStartupErrorToAllure(): Promise<void> {
  const message = globalThis.speculosStartupErrorMessage;
  if (message?.trim()) {
    await allure.attachment("Speculos startup error", message, "text/plain");
    globalThis.speculosStartupErrorMessage = undefined;
  }
}

// --- Webview / app logs formatting and Allure attachment ---

const TS_WIDTH = 28;
const LEVEL_WIDTH = 7;
const INDENT = "  ";

export type WebviewConsoleEntry = { timestamp?: string; level?: string; text?: string };

function stripConsoleFormatting(text: string): string {
  return text
    .replace(/%c\s*\[[^\]]*\]\s*/g, "") // %c[WindowMessage]
    .replace(/%c[^%]*?(?=\s*\{|$)/g, "") // %c anything before { or EOL
    .replace(/\s*background:\s*#[0-9a-fA-F]+\s*;\s*color:\s*#[0-9a-fA-F]+\s*;?\s*/g, "")
    .replace(/\s*color:\s*#[0-9a-fA-F]+\s*;?\s*/g, "")
    .trim();
}

function splitSummaryAndJson(text: string): { summary: string; body: string | null } {
  const brace = text.indexOf("{");
  const bracket = text.indexOf("[");
  const jsonStart = brace === -1 ? bracket : bracket === -1 ? brace : Math.min(brace, bracket);
  if (jsonStart === -1) {
    return { summary: text, body: null };
  }
  const summary = text.slice(0, jsonStart).trim();
  const jsonStr = text.slice(jsonStart);
  try {
    const parsed = JSON.parse(jsonStr);
    const body = JSON.stringify(parsed, null, 2);
    return { summary: summary || "(JSON)", body };
  } catch {
    return {
      summary: text.slice(0, 200) + (text.length > 200 ? "…" : ""),
      body: null,
    };
  }
}

export function formatWebviewConsoleLogs(entries: WebviewConsoleEntry[]): string {
  const lines: string[] = [
    "TIMESTAMP                      | LEVEL   | MESSAGE",
    "-------------------------------|---------|--------",
  ];

  for (const e of entries) {
    const ts = (e.timestamp ?? "").slice(0, TS_WIDTH).padEnd(TS_WIDTH);
    const level = (e.level ?? "log").toUpperCase().padEnd(LEVEL_WIDTH);
    const raw = (e.text ?? "").replace(/\n/g, " ");
    const cleaned = stripConsoleFormatting(raw);
    const { summary, body } = splitSummaryAndJson(cleaned);
    const summaryLine = summary.length > 120 ? summary.slice(0, 120) + "…" : summary;
    lines.push(`${ts} | ${level} | ${summaryLine}`);
    if (body) {
      body.split("\n").forEach(line => lines.push(INDENT + line));
    }
  }

  return lines.join("\n");
}

type ParsedLogsPayload = {
  appLogs?: unknown;
  webviewNetworkLogs?: unknown[];
  webviewConsoleLogs?: WebviewConsoleEntry[];
  webviewLoadErrors?: unknown[];
};

/** Parse logs payload and attach App logs, Webview Network Logs, and Webview Console Logs to Allure. */
export async function attachFailureLogsToAllure(logsPayload: string): Promise<void> {
  let parsed: ParsedLogsPayload;
  try {
    parsed = JSON.parse(logsPayload);
  } catch {
    parsed = { appLogs: logsPayload };
  }

  await allure.attachment(
    "App logs",
    JSON.stringify(parsed.appLogs ?? logsPayload),
    "application/json",
  );
  if (parsed.webviewNetworkLogs?.length) {
    await allure.attachment(
      "Webview Network Logs",
      JSON.stringify(parsed.webviewNetworkLogs, null, 2),
      "application/json",
    );
  }
  if (parsed.webviewConsoleLogs?.length) {
    await allure.attachment(
      "Webview Console Logs",
      formatWebviewConsoleLogs(parsed.webviewConsoleLogs),
      "text/plain",
    );
  }

  if (parsed.webviewLoadErrors?.length) {
    await allure.attachment(
      "Webview Load Errors",
      JSON.stringify(parsed.webviewLoadErrors, null, 2),
      "application/json",
    );
  }
}
