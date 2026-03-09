#!/usr/bin/env zx
/**
 * CI lint script for ledger-live-desktop.
 * Runs oxlint with JSON output, converts to ESLint-shaped JSON for artifact/annotations,
 * and prints a human-readable summary. Exits with 1 if there are any errors.
 */
import { basename, join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const desktopRoot = join(__dirname, "..");

$.verbose = true;

if (os.platform() === "win32") {
  usePowerShell();
}

const usage = () => {
  console.log(`Usage: ${basename(__filename)} [-h] [--external]`);
  process.exit(1);
};

let external = false;

for (const arg in argv) {
  switch (arg) {
    case "h":
      usage();
      break;
    case "external":
      external = true;
      break;
    case "_":
      break;
    default:
      usage();
      break;
  }
}

const outputFile = external ? "lint-desktop-external.json" : "lint-desktop.json";
const outputPath = join(desktopRoot, outputFile);

/**
 * Transform oxlint JSON output to ESLint-style format for:
 * - upload artifact (report step expects this shape)
 * - GitHub annotations: filePath, messages[], errorCount, warningCount, severity, line, etc.
 * Oxlint diagnostics: message, code, severity, filename, labels: [{ offset, length, line, column }]
 */
function oxlintToEslintFormat(oxlintJson) {
  const byFile = new Map();
  for (const d of oxlintJson.diagnostics || []) {
    const filePath = d.filename ?? d.file ?? "";
    if (!byFile.has(filePath)) {
      byFile.set(filePath, { filePath, messages: [], errorCount: 0, warningCount: 0, fatalErrorCount: 0 });
    }
    const rec = byFile.get(filePath);
    const label = d.labels?.[0] ?? {};
    const line = label.line ?? 1;
    const column = label.column ?? 1;
    const severityNum = d.severity === "error" ? 2 : 1;
    rec.messages.push({
      line,
      endLine: line,
      column,
      endColumn: column,
      severity: severityNum,
      message: d.message ?? "",
      ruleId: d.code ?? "unknown",
    });
    if (d.severity === "error") rec.errorCount += 1;
    else rec.warningCount += 1;
  }
  return [...byFile.values()];
}

const lint = async () => {
  cd(desktopRoot);
  // Use explicit config path so CI and local use the same .oxlintrc.json (rule overrides, etc.)
  const configPath = join(desktopRoot, ".oxlintrc.json");
  const result = await $`pnpm exec oxlint -c ${configPath} src static tools tests --format=json`.quiet().nothrow();
  const jsonStr = result.stdout?.trim() || "{}";

  let oxlintResult;
  try {
    oxlintResult = JSON.parse(jsonStr);
  } catch {
    console.error("Failed to parse oxlint JSON output");
    process.exit(1);
  }

  const eslintFormat = oxlintToEslintFormat(oxlintResult);
  await writeFile(outputPath, JSON.stringify(eslintFormat, null, 2), "utf-8");

  // Human-readable summary (similar to stylish)
  const hasErrors = eslintFormat.some((r) => r.errorCount > 0);
  const totalErrors = eslintFormat.reduce((s, r) => s + r.errorCount, 0);
  const totalWarnings = eslintFormat.reduce((s, r) => s + r.warningCount, 0);
  if (totalErrors + totalWarnings > 0) {
    for (const file of eslintFormat) {
      if (file.messages.length === 0) continue;
      console.log(`\n${file.filePath}`);
      for (const m of file.messages) {
        const level = m.severity === 2 ? "error" : "warning";
        console.log(`  ${m.line}:${m.column}  ${level}  ${m.message}  (${m.ruleId})`);
      }
    }
    console.log(`\n✖ ${totalErrors} error(s), ${totalWarnings} warning(s)`);
  } else {
    console.log("No lint issues found.");
  }

  if (hasErrors) {
    process.exit(1);
  }
};

await lint();