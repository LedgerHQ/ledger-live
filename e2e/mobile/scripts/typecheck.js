const ts = require("typescript");
const path = require("path");
const { EOL } = require("os");

const rootDirectory = path.resolve(__dirname, "..", "..", "..");
const e2eDirectory = path.resolve(__dirname, "..");

function compile() {
  const config = ts.parseJsonConfigFileContent(require("../tsconfig.json"), ts.sys, e2eDirectory);

  const program = ts.createProgram(config.fileNames, {
    ...config.options,
    noEmit: true,
  });

  console.log(`⏳ - Running typescript type checker...`);

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    // Only include errors from e2e/mobile directory
    .filter(
      diag =>
        diag.file &&
        diag.file.fileName.startsWith(e2eDirectory) &&
        /\.tsx?/.test(diag.file.fileName),
    );

  const formatDiagnosticHost = {
    getNewLine: () => EOL,
    getCurrentDirectory: () => rootDirectory,
    getCanonicalFileName: p => p,
  };

  console.log(ts.formatDiagnosticsWithColorAndContext(allDiagnostics, formatDiagnosticHost));

  if (allDiagnostics.length > 0) {
    console.log(`⚠️ - Found ${allDiagnostics.length} errors. `);
    process.exitCode = 1;
  } else {
    console.log("✅ - All Good!");
  }
}

compile();
