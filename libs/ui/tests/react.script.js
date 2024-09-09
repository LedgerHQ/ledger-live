const child_process = require("child_process");

const exampleName = process.argv[2] || "";

const UPDATE_SNAPSHOTS = process.env["UPDATE_SNAPSHOTS"];

const prepareExample = `pnpm clean:full 2>&1 | sed 's/^/[DEBUG: PNPM CLEAN] /' && echo "DEBUG cleaned" && pnpm i --filter="${exampleName}-example" 2>&1 | sed 's/^/[DEBUG: PNPM INSTALL] /' && echo "DEBUG installed" && pnpm build 2>&1 | sed 's/^/[DEBUG: PNPM BUILD] /' && echo "DEBUG built"`;
const runTest = `pnpm concurrently -s=first -k "pnpm --dir examples/${exampleName} serve" "playwright test ${
  UPDATE_SNAPSHOTS ? "--update-snapshots" : ""
}"`;

try {
  child_process.execSync(prepareExample, {
    stdio: "inherit",
    cwd: `./examples/${exampleName}`,
  });
  child_process.execSync(`echo "DEBUG prepareExample finished"`, { stdio: "inherit" });
  child_process.execSync(runTest, { stdio: "inherit" });
} catch (error) {
  console.error(error.message);
  process.exit(error.status);
}
