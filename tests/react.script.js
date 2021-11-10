const child_process = require("child_process");

const exampleName = process.argv[2] || "";

const UPDATE_SNAPSHOTS = process.env["UPDATE_SNAPSHOTS"];

const addPackageResolutions = `
  yarn json -I -f ./examples/${exampleName}/package.json -e 'this.resolutions={
    "@ledgerhq/react-ui": "../../packages/react/lib",
    "@ledgerhq/react-ui/**/@ledgerhq/ui-shared": "../../packages/shared",
    "@ledgerhq/react-ui/**/@ledgerhq/icons-ui": "../../packages/icons"
  }'
`;
const rollbackPackageResolutions = `
  yarn json -I -f ./examples/${exampleName}/package.json -e 'delete this.resolutions'
`;
const prepareExample = `yarn clean:full && yarn && yarn build`;
const runTest = `yarn concurrently -s=first -k "yarn --cwd examples/${exampleName} serve" "playwright test ${
  UPDATE_SNAPSHOTS ? "--update-snapshots" : ""
}"`;

try {
  child_process.execSync(addPackageResolutions, { stdio: "inherit" });
  child_process.execSync(prepareExample, {
    stdio: "inherit",
    cwd: `./examples/${exampleName}`,
  });
  child_process.execSync(runTest, { stdio: "inherit" });
  child_process.execSync(rollbackPackageResolutions, { stdio: "inherit" });
} catch (error) {
  child_process.execSync(rollbackPackageResolutions, { stdio: "inherit" });
  console.error(error.message);
  process.exit(error.status);
}
