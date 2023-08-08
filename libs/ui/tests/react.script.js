const child_process = require("child_process");

const exampleName = process.argv[2] || "";

const UPDATE_SNAPSHOTS = process.env["UPDATE_SNAPSHOTS"];

const prepareExample = `pnpm clean:full && pnpm i --filter="${exampleName}-example" && pnpm build`;
const runTest = `pnpm concurrently -s=first -k "pnpm --dir examples/${exampleName} serve" "playwright test ${
  UPDATE_SNAPSHOTS ? "--update-snapshots" : ""
}"`;

try {
  child_process.execSync(prepareExample, {
    stdio: "inherit",
    cwd: `./examples/${exampleName}`,
  });
  child_process.execSync(runTest, { stdio: "inherit" });
} catch (error) {
  console.error(error.message);
  process.exit(error.status);
}
