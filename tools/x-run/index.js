const child_process = require("child_process");

const isWindows = process.platform === "win32";
const [, , target, ...args] = process.argv;

const spawnArgs = [
  isWindows ? "node" : target,
  isWindows ? [target, ...args] : args,
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_PATH: undefined,
    },
  },
];

const { error, status } = child_process.spawnSync(...spawnArgs);
if (error) console.error(error);

process.exit(status || 0);
