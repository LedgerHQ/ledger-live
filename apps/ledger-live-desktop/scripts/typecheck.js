/* eslint-disable */

const ts = require("typescript");
const path = require("path");
const { EOL } = require("os");

const rootDirectory = path.resolve(__dirname, "..", "..", "..");
const projectDirectory = path.resolve(__dirname, "..");

const excluded = [
  "src/renderer/components",
  "src/renderer/screens",
  "src/renderer/modals",
  "src/renderer/families",
].map(p => path.resolve(projectDirectory, p));

function compile() {
  const config = ts.parseJsonConfigFileContent(require("../tsconfig.json"), ts.sys, process.cwd());
  const program = ts.createProgram(config.fileNames, {
    ...config.options,
    noEmit: true,
  });

  console.log(`⏳ - Running typescript type checker on ${config.fileNames.length} files…`);

  let nbOfFilteredDiagnostics = 0;

  const allDiagnostics = ts.getPreEmitDiagnostics(program).filter(diag => {
    // Exclude non ts(x) files and files in non-typed zones
    const pass =
      /\.tsx?/.test(diag.file.fileName) &&
      excluded.every(zone => !diag.file.fileName.startsWith(zone));
    if (!pass) nbOfFilteredDiagnostics++;
    return pass;
  });

  const formatDiagnosticHost = {
    getNewLine: () => EOL,
    getCurrentDirectory: () => rootDirectory,
    getCanonicalFileName: path => path,
  };

  if (allDiagnostics.length > 0) {
    console.log(ts.formatDiagnosticsWithColorAndContext(allDiagnostics, formatDiagnosticHost));

    console.log("Errors  Files");
    console.log("‾‾‾‾‾‾  ‾‾‾‾‾");

    const errorsByFile = allDiagnostics.reduce((acc, diag) => {
      const fileName = diag.file.fileName;
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
}

compile();
