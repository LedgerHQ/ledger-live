/**
 * Runs tsgo and only fails on type errors in e2e/mobile files
 * (errors in ../../apps/ledger-live-mobile or ../../libs are ignored,
 * same as the previous tsc-based script).
 */
const { execSync } = require("child_process");
const path = require("path");

const e2eDir = path.resolve(__dirname, "..");
const e2eDirSlash = e2eDir + path.sep;

function main() {
  console.log("⏳ - Running typescript type checker (tsgo)...");

  let output;
  try {
    output = execSync("pnpm exec tsgo --noEmit", {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      cwd: e2eDir,
    });
  } catch (err) {
    output = (err.stdout || "") + (err.stderr || "");
  }

  const lines = output.split("\n");
  const localErrors = [];
  let inError = false;
  let currentFile = null;

  for (const line of lines) {
    // Match "path(line,col): error TS..."
    const match = line.match(/^(.+?)\((\d+),(\d+)\):\s*error (TS\d+):/);
    if (match) {
      const filePath = path.resolve(e2eDir, match[1].trim());
      if (filePath.startsWith(e2eDirSlash) && /\.tsx?$/.test(filePath)) {
        currentFile = match[1].trim();
        inError = true;
        localErrors.push(line);
      } else {
        inError = false;
      }
    } else if (inError && currentFile && (line.startsWith(" ") || line.startsWith("\t"))) {
      localErrors.push(line);
    } else {
      inError = false;
    }
  }

  if (localErrors.length > 0) {
    console.log(localErrors.join("\n"));
    console.log(`\n⚠️ - Found ${localErrors.length} error(s) in e2e/mobile.`);
    process.exit(1);
  }

  console.log("✅ - All Good!");
}

main();
