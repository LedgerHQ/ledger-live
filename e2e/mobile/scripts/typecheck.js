const { API, formatDiagnosticsWithColorAndContext } = require("typescript/sync");
const path = require("path");
const { EOL } = require("os");

const rootDirectory = path.resolve(__dirname, "..", "..", "..");
const e2eDirectory = path.resolve(__dirname, "..");

function compile() {
  const configPath = path.join(e2eDirectory, "tsconfig.json");
  const api = new API({ cwd: e2eDirectory });
  const project = api
    .createSnapshot({ openProjects: [configPath] })
    .getConfiguredProject(configPath);

  if (!project) {
    console.error(`❌ - Could not read ${configPath}`);
    process.exitCode = 1;
    api.close();
    return;
  }

  const { program } = project;

  console.log(`⏳ - Running typescript type checker...`);

  const allDiagnostics = [
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getProgramDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ]
    // Config errors, plus errors from e2e/mobile sources
    .filter(
      ({ fileName }) =>
        !fileName ||
        /tsconfig[^/]*\.json$/.test(fileName) ||
        (fileName.startsWith(e2eDirectory) && /\.[cm]?tsx?$/.test(fileName)),
    );

  const formatDiagnosticHost = {
    getNewLine: () => EOL,
    getCurrentDirectory: () => rootDirectory,
    getCanonicalFileName: p => p,
  };

  console.log(formatDiagnosticsWithColorAndContext(allDiagnostics, formatDiagnosticHost));

  if (allDiagnostics.length > 0) {
    console.log(`⚠️ - Found ${allDiagnostics.length} errors. `);
    process.exitCode = 1;
  } else {
    console.log("✅ - All Good!");
  }
  api.close();
}

compile();
