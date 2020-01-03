// @flow
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const now = require("performance-now");
const { exec } = require("child_process");
const debug = require("debug")("benchmark");
const commandLineArgs = require("command-line-args");

const mainOptions = commandLineArgs(
  [
    { name: "command", defaultOption: true },
    { name: "help", alias: "h", type: Boolean, desc: "display this help" }
  ],
  { stopAtFirstUnknown: true }
);

const commonOpts = [
  {
    name: "filter",
    alias: "f",
    type: String,
    description: "filter the test by name"
  },
  {
    name: "target",
    alias: "t",
    type: String,
    description: "specify a target to run on",
    multiple: true
  },
  {
    name: "count",
    alias: "n",
    type: Number,
    description: "number of time to run the same test (to improve precision)"
  }
];

const accountOpts = [
  {
    name: "currency",
    alias: "c",
    description: "currency name or id",
    type: String
  },
  {
    name: "xpub",
    description: "account xpub",
    type: String
  }
];

const commands = {
  runTests: {
    description: "run all tests",
    job: runTests,
    args: [...commonOpts]
  },
  benchmarkFirstSync: {
    description: "test first sync of a specific account",
    job: runBenchmarkFirstSync,
    args: [...commonOpts, ...accountOpts]
  },
  benchmarkSecondSync: {
    description: "test second sync (incremental) of a specific account",
    job: runBenchmarkSecondSync,
    args: [...commonOpts, ...accountOpts]
  }
};

if (mainOptions.help || !mainOptions.command) {
  console.log("Usage: yarn start");
  console.log("OR");
  console.log("Usage: yarn start <command> ...");
  console.log("");
  for (const k in commands) {
    const cmd = commands[k];
    console.log(
      `Usage: yarn start ${k} `.padEnd(30) +
        (cmd.description ? `# ${cmd.description}` : "")
    );
    for (const opt of cmd.args) {
      let str = opt.alias ? ` -${opt.alias}, ` : "     ";
      str += `--${opt.name}`;
      if ((opt.type && opt.type !== Boolean) || opt.typeDesc) {
        str += ` <${opt.typeDesc || opt.type.name}>`;
      }
      if (opt.desc) {
        str = str.padEnd(30) + `: ${opt.desc}`;
      }
      console.log(str);
    }
    console.log("");
  }
  process.exit(0);
}

const cmd = commands[mainOptions.command];
if (!cmd) {
  console.error("Command not found: yarn start " + mainOptions.command);
  process.exit(1);
}
const argv = mainOptions._unknown || [];
const options = commandLineArgs(cmd.args, { argv });

const targets = [
  ...(options.target && options.target.length
    ? options.target
    : fs.readdirSync("targets")
  ).map(name => ({
    name,
    dir: path.join(__dirname, "targets", name)
  })),
  {
    name: "HEAD",
    dir: path.join(__dirname, "../cli")
  }
];

const execP = (cmd, opts = {}) =>
  new Promise(resolve => {
    exec(cmd, opts, (err, stdout, stderr) => {
      resolve({ err, stdout, stderr });
    });
  });

const execOnTargets = async cmdOrF => {
  const res = [];
  for (const target of targets) {
    const startTime = now();
    const cmd = typeof cmdOrF === "function" ? cmdOrF(target) : cmdOrF;
    debug("cmd on " + target.name + " : " + cmd);
    const r = await execP(cmd, { cwd: target.dir });
    debug("cmd done " + target.name + ": " + (r.err ? String(r.err) : "OK"));
    res.push({ ...r, target, time: r.err ? 0 : now() - startTime });
  }
  return res;
};

const formatTime = t => `${t < 5 ? t.toFixed(2) : t.toFixed(0)}ms`;

const formatTimeCmp = (ref, t) => {
  const percent = Math.round(
    ref > t ? (100 * (ref - t)) / ref : (100 * (t - ref)) / ref
  );
  return percent === 0
    ? "similar"
    : ref > t
    ? `${percent}% faster`
    : `${percent}% slower`;
};

const makeTimeStats = times => {
  times = times.slice(0).sort((a, b) => a - b);
  const count = times.length;
  let sum = 0;
  for (let i = 0; i < times.length; i++) {
    sum += times[i];
  }
  const avg = sum / count;
  const median = times[Math.floor(times.length / 2)];
  return { avg, median, count };
};

async function benchmark({
  name,
  cmd,
  count,
  // $FlowFixMe
  beforeRun,
  // $FlowFixMe
  filter
}) {
  if (filter && !name.includes(filter)) return;
  const startTime = now();
  const max = count || 1;
  const runs = [];
  for (let i = 0; i < max; i++) {
    debug(name + " run " + i + " out of " + max);
    if (beforeRun) {
      await execOnTargets(beforeRun);
    }
    const run = await execOnTargets(cmd);
    runs.push(run);
  }

  const r = targets.map(target => {
    const all = runs.map(r => {
      const t = r.find(r => r.target === target);
      if (!t) throw new Error("missing target " + target.name);
      return t;
    });
    return {
      target,
      err: all.find(r => r.err),
      stderr: all.map(r => r.stderr).join("\n"),
      timeStats: makeTimeStats(all.map(r => r.time))
    };
  });

  const head = r.find(({ target }) => target.name === "HEAD");
  if (!head) throw new Error("missing result for HEAD");
  if (head.err) throw head.err;
  const rest = r.filter(({ target }) => target.name !== "HEAD");

  console.log(
    `${name} (${max} runs, ${targets.length} targets) – (total ${formatTime(
      now() - startTime
    )})`
  );
  console.log(
    `  current: median ${formatTime(head.timeStats.median)} avg ${formatTime(
      head.timeStats.avg
    )}`
  );
  rest.forEach(({ target, timeStats, err }) =>
    console.log(
      err
        ? `  ${target.name}: ERROR!`
        : `  ${target.name}: median ${formatTime(
            timeStats.median
          )} (${formatTimeCmp(
            head.timeStats.median,
            timeStats.median
          )}) (avg ${formatTime(timeStats.avg)})`
    )
  );

  r.forEach(({ target, err, stderr }) => {
    if (err) {
      console.error(`ERROR for ${target.name}:`);
      console.error(err);
      console.error(stderr);
    }
  });
  console.log("");
}

const buggyJSONParsing = {
  latest: true,
  v10: true
};

async function runBenchmarkFirstSync(opts) {
  const count = opts.count || 3;
  const syncArgs = `-c "${opts.currency}" --xpub "${opts.xpub}"`;

  await benchmark({
    name: `first sync ${opts.currency}`,
    beforeRun: "rm -rf dbdata && rm -rf tmp && mkdir tmp",
    cmd: `npx ledger-live sync ${syncArgs}`,
    count
  });
}

async function runBenchmarkSecondSync(opts) {
  const count = opts.count || 3;
  const syncArgs = `-c "${opts.currency}" --xpub "${opts.xpub}"`;

  await execOnTargets("rm -rf dbdata && rm -rf tmp && mkdir tmp");
  const r = await execOnTargets(
    `npx ledger-live sync ${syncArgs} --format json > tmp/account.json`
  );
  const err = r.find(r => r.err);
  if (err) {
    console.error(r.map(r => r.stderr || "").join("\n"));
    throw err;
  }

  await benchmark({
    name: `sync ${opts.currency}`,
    // there is no longer a bug of JSON parsing...
    cmd: target =>
      target.name in buggyJSONParsing
        ? `npx ledger-live sync  ${syncArgs}`
        : `npx ledger-live sync --file tmp/account.json`,
    count
  });
}

async function runTests(opts) {
  const count = opts.count || 3;
  const filter = opts.filter;

  const accountsDataset = [
    {
      currency: "bitcoin",
      xpub:
        "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn"
    },
    {
      currency: "ethereum",
      xpub:
        "xpub6BemYiVNp19ZzH73tAbE9guoQcyygwpWgmrch2J2WsbJhxUSnjZXpMnAKru6wXK3AWxU2fywYBCdojmwnFL6qiH3ByqXpDJ2PKGijdaNvAb"
    }
  ];

  await benchmark({
    name: "boot time",
    cmd: "npx ledger-live version",
    count,
    filter
  });

  for (let { currency, xpub } of accountsDataset) {
    await benchmark({
      name: `first sync ${currency}`,
      beforeRun: "rm -rf dbdata && rm -rf tmp && mkdir tmp",
      cmd: `npx ledger-live sync -c ${currency} --xpub ${xpub} --format json > tmp/account.json`,
      count,
      filter
    });

    await benchmark({
      name: `second sync ${currency}`,
      // there is no longer a bug of JSON parsing...
      cmd: target =>
        target.name in buggyJSONParsing
          ? `npx ledger-live sync  -c ${currency} --xpub ${xpub}`
          : `npx ledger-live sync --file tmp/account.json`,
      count,
      filter
    });
  }
}

cmd.job(options).catch(e => {
  console.error(e);
  process.exit(1);
});
