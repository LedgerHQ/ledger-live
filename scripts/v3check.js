const exec = require("child_process").exec;

/* eslint-disable no-console */

const LOG_COMMANDS = false;
const TEST_FILES = false;
const TS_TEST_FILES = [
  // "src/screens/Settings/General/index.tsx",
  "src/components/CurrencyRate.tsx",
];

async function executeAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function listTsJsFilesPairs() {
  const jsFilesPath = {};
  const jsTsPairs = [];
  await executeAsync('git ls-files | grep -e ".\\.js$"').then(res =>
    res.split("\n").map(path => (jsFilesPath[path] = true)),
  );
  return executeAsync('git ls-files | grep -e ".\\.ts$" -e ".\\.tsx$"')
    .then(res =>
      res.split("\n").forEach(path => {
        const beforeExtensionPath = path
          .split(".")
          .slice(0, -1)
          .join(".");
        const jsFilePath = `${beforeExtensionPath}.js`;
        if (jsFilesPath[jsFilePath]) {
          jsTsPairs.push({
            tsFilePath: path,
            jsFilePath,
          });
        }
      }),
    )
    .then(() => jsTsPairs);
}

const branchRebrand = "LL-7742";
const branchRelease = "release/v3.0.x";
const mainBranchName = "develop";

async function getFileCreationDate(filePath, firstParent) {
  const command = `git log --format=%aD --first-parent ${firstParent} --no-merges ${filePath} | tail -1`;
  LOG_COMMANDS && console.log(`getFileCreationDate command:\n\t${command}`);
  const rawDate = await executeAsync(command);
  return { date: rawDate ? new Date(rawDate) : null, command };
}

async function listCommits(filePath, sinceDateIsoString) {
  const command = `git log \
    --first-parent \
    ${mainBranchName} \
    ${sinceDateIsoString ? `--since=${sinceDateIsoString}` : ""} \
    --pretty=format:"%aI %H %s" \
    ${filePath}`;
  LOG_COMMANDS && console.log(`listCommits command:\n\t${command}`);
  const rawResult = await executeAsync(command);
  const commitsRaw = rawResult.split("\n").filter(l => !!l);
  return commitsRaw.map(commitRaw => {
    const [dateStr, hashStr, ...rest] = commitRaw.split(" ");
    const message = rest.join(" ");
    return {
      date: new Date(dateStr),
      hashStr,
      message,
      command,
    };
  });
}

function pbcopy(data) {
  const proc = require("child_process").spawn("pbcopy");
  proc.stdin.write(data);
  proc.stdin.end();
}

async function generateMarkdownTodoList() {
  const pairs = await listTsJsFilesPairs();
  let todoList = "";
  const res = await Promise.all(
    pairs
      .filter(
        ({ tsFilePath }) => !TEST_FILES || TS_TEST_FILES.includes(tsFilePath),
      )
      .map(async ({ tsFilePath, jsFilePath }) => {
        const { date: tsFileCreationDate } = await getFileCreationDate(
          tsFilePath,
          branchRebrand,
        ).then(res =>
          res === null ? getFileCreationDate(tsFilePath, branchRelease) : res,
        );
        const commits = tsFileCreationDate
          ? await listCommits(jsFilePath, tsFileCreationDate.toISOString())
          : [];
        return { tsFilePath, jsFilePath, commits };
      }),
  );
  res.forEach(({ jsFilePath, commits }) => {
    if (commits.length === 0) return;
    console.log("jsFilePath", jsFilePath);
    todoList += `- [ ] **${jsFilePath}**\n`;
    commits.forEach(({ message, date, hashStr }) => {
      todoList += `  - [ ] ${date.toDateString()} ${hashStr} ${message}\n`;
    });
    todoList += "\n";
  });
  return todoList;
}

generateMarkdownTodoList().then(pbcopy);
