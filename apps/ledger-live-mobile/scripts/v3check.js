const { executeAsync, listTsJsFilesPairs, GIT_PATH } = require("./v3-common");

/* eslint-disable no-console */

const LOG_COMMANDS = false;
const TEST_FILES = false;
const TS_TEST_FILES = [
  // "src/screens/Settings/General/index.tsx",
  "src/components/CurrencyRate.tsx",
];

const branchRebrand = "LL-7742";
const branchRelease = "release/v3.0.x";
const mainBranchName = "develop";

async function getFileCreationDate(filePath, firstParent) {
  const args = ["log", "--format=%aD", "--first-parent", firstParent, "--no-merges", filePath];
  LOG_COMMANDS && console.log("getFileCreationDate args:", args);
  const output = await executeAsync(GIT_PATH, args);
  const lines = output.split("\n").filter(Boolean);
  const rawDate = lines.length > 0 ? lines[lines.length - 1] : null;
  return { date: rawDate ? new Date(rawDate) : null, command: `git ${args.join(" ")}` };
}

async function listCommits(filePath, sinceDateIsoString) {
  const args = [
    "log",
    "--first-parent",
    mainBranchName,
    "--pretty=format:%aI %H %s",
    filePath,
  ];
  if (sinceDateIsoString) args.splice(3, 0, `--since=${sinceDateIsoString}`);
  LOG_COMMANDS && console.log("listCommits args:", args);
  const rawResult = await executeAsync(GIT_PATH, args);
  const command = `git ${args.join(" ")}`;
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
      .filter(({ tsFilePath }) => !TEST_FILES || TS_TEST_FILES.includes(tsFilePath))
      .map(async ({ tsFilePath, jsFilePath }) => {
        const { date: tsFileCreationDate } = await getFileCreationDate(
          tsFilePath,
          branchRebrand,
        ).then(res => (res === null ? getFileCreationDate(tsFilePath, branchRelease) : res));
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
