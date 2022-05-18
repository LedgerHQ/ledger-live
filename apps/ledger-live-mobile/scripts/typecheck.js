/* eslint-disable */

const ts = require("typescript");
const path = require("path");
const { EOL } = require("os");

const rootDirectory = path.resolve(__dirname, "..", "..", "..");

function compile() {
  const config = ts.parseJsonConfigFileContent(
    require("../tsconfig.json"),
    ts.sys,
    process.cwd(),
  );
  const program = ts.createProgram(config.fileNames, {
    ...config.options,
    noEmit: true,
  });
  program.type;

  console.log(
    `⏳ - Running typescript type checker on ${config.fileNames.length} files…`,
  );

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    // Ignore js files
    .filter(diag => /\.tsx?/.test(diag.file.fileName));

  const formatDiagnosticHost = {
    getNewLine: () => EOL,
    getCurrentDirectory: () => rootDirectory,
    getCanonicalFileName: path => path,
  };

  console.log(
    ts.formatDiagnosticsWithColorAndContext(
      allDiagnostics,
      formatDiagnosticHost,
    ),
  );

  if (allDiagnostics.length > 0) {
    console.log(`⚠️ - Found ${allDiagnostics.length} errors.`);
    process.exitCode = 1;
  } else {
    console.log("✅ - All Good!");
  }
}

compile();
