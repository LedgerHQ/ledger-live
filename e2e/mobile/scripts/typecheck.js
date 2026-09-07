const ts = require("typescript");
const path = require("path");
const { EOL } = require("os");

const rootDirectory = path.resolve(__dirname, "..", "..", "..");
const e2eDirectory = path.resolve(__dirname, "..");

const parseConfigHost = {
  useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
  readDirectory: ts.sys.readDirectory,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  onUnRecoverableConfigFileDiagnostic: diagnostic => {
    console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, EOL));
    process.exit(1);
  },
};

function compile() {
  const configPath = path.join(e2eDirectory, "tsconfig.json");
  const config = ts.getParsedCommandLineOfConfigFile(configPath, { noEmit: true }, parseConfigHost);

  if (!config) {
    console.error(`❌ - Could not read ${configPath}`);
    process.exitCode = 1;
    return;
  }

  const program = ts.createProgram(config.fileNames, config.options);

  console.log(`⏳ - Running typescript type checker...`);

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    // Only include errors from e2e/mobile directory
    .filter(
      diag => diag.file?.fileName.startsWith(e2eDirectory) && /\.tsx?/.test(diag.file.fileName),
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
