/* eslint-disable */

const { API, formatDiagnosticsWithColorAndContext } = require("typescript/sync");
const path = require("path");
const { EOL } = require("os");

const rootDirectory = path.resolve(__dirname, "..", "..", "..");
const projectDirectory = path.resolve(__dirname, "..");

const excluded = [].map(p => path.resolve(projectDirectory, p));

const appSourcePrefixes = [
  path.resolve(projectDirectory, "src") + path.sep,
  path.resolve(projectDirectory, "tests") + path.sep,
  path.resolve(projectDirectory, "tools") + path.sep,
];

function compile() {
  const configPath = path.join(projectDirectory, "tsconfig.json");
  const api = new API({ cwd: projectDirectory });
  const project = api
    .createSnapshot({ openProjects: [configPath] })
    .getConfiguredProject(configPath);
  if (!project) throw new Error(`Could not load ${configPath}`);
  const { parsedCommandLine: config, program } = project;

  console.log(`⏳ - Running typescript type checker on ${config.fileNames.length} files…`);

  let nbOfFilteredDiagnostics = 0;

  const allDiagnostics = [
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getProgramDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ].filter(diag => {
    const { fileName } = diag;
    if (!fileName || /tsconfig[^/]*\.json$/.test(fileName)) return true;
    const isAppSource = appSourcePrefixes.some(prefix => fileName.startsWith(prefix));
    const pass =
      /\.[cm]?tsx?$/.test(fileName) &&
      isAppSource &&
      excluded.every(zone => !fileName.startsWith(zone));
    if (!pass) nbOfFilteredDiagnostics++;
    return pass;
  });

  const formatDiagnosticHost = {
    getNewLine: () => EOL,
    getCurrentDirectory: () => rootDirectory,
    getCanonicalFileName: path => path,
  };

  if (allDiagnostics.length > 0) {
    console.log(formatDiagnosticsWithColorAndContext(allDiagnostics, formatDiagnosticHost));

    console.log("Errors  Files");
    console.log("‾‾‾‾‾‾  ‾‾‾‾‾");

    const errorsByFile = allDiagnostics.reduce((acc, diag) => {
      const fileName = diag.fileName ?? "<global>";
      acc[fileName] = (acc[fileName] || 0) + 1;
      return acc;
    }, {});

    Object.entries(errorsByFile)
      // Sort by the error count
      .sort((a, b) => b[1] - a[1])
      .forEach(([fileName, counter]) => {
        const decimals = Math.floor(Math.log10(counter)) + 1;
        let str = "";
        new Array(6 - decimals).fill().forEach(() => (str += " "));
        str += counter;
        str += "  ";
        str += fileName;
        console.log(str);
      });
    console.log("");
    console.log(
      `⚠️ - Found ${allDiagnostics.length} errors in ${Object.keys(errorsByFile).length} files.\n`,
    );
    process.exitCode = 1;
  } else {
    console.log("✅ - All Good!");
  }
  console.log(`(Filtered ${nbOfFilteredDiagnostics} errors)`);
  api.close();
}

compile();
