#!/usr/bin/env node
const SentryCli = require("@sentry/cli");
const yargs = require("yargs");
const execa = require("execa");
const Listr = require("listr");
const verboseRenderer = require("listr-verbose-renderer");
const path = require("path");
const rimraf = require("rimraf");
const pkg = require("../../package.json");
const Draft = require("./draft");
const healthChecksTasks = require("./health-checks");

require("dotenv").config();

const releaseSentryDSN =
  "https://5729b6ee405f416a8998ae4d43c87d58@o118392.ingest.sentry.io/6488660";
const prereleaseSentryDSN =
  "https://5514716222674afd816b0961d7b4378c@o118392.ingest.sentry.io/6488659";

const rootFolder = "../../";
let verbose = false;

const exec = async (file, args, options = {}) => {
  const opts = verbose ? { stdio: "inherit", ...options } : options;

  return execa(file, args, opts);
};

const rmDir = dir => {
  const fullPath = path.resolve(__dirname, rootFolder, dir);
  return rimraf(fullPath);
};

const cleaningTasks = args => [
  {
    title: "Remove `node_modules/.cache` folder",
    task: () => rmDir("node_modules/.cache"),
  },
  {
    title: "Remove `.webpack` folder",
    task: () => rmDir(".webpack"),
  },
  {
    title: "Remove `dist` folder",
    task: () => rmDir("dist"),
  },
];

// const setupTasks = args => [
//   {
//     title: "Installing packages",
//     task: async () => {
//       await exec("pnpm", [
//         "i",
//         "--filter=ledger-live-desktop...",
//         "--filter=ledger-live",
//         "--unsafe-perm",
//         "--package-import-method=copy",
//         "--node-linker=hoisted",
//       ]);
//     },
//   },
// ];

const buildTasks = args => [
  {
    title: "Compiling assets",
    task: async () => {
      await exec("pnpm", ["run", "build:js"], {
        env: args.release
          ? { SENTRY_URL: releaseSentryDSN }
          : args.pre
          ? { SENTRY_URL: prereleaseSentryDSN }
          : {},
      });
    },
  },
  {
    title: "Upload to Sentry",
    enabled: () => args.release || args.pre,
    task: async () => {
      const cli = new SentryCli(
        args.release
          ? "sentry.release.properties"
          : args.pre
          ? "sentry.prerelease.properties"
          : null,
        {
          authToken: process.env.SENTRY_AUTH_TOKEN,
        },
      );
      await cli.releases.uploadSourceMaps(pkg.version, {
        urlPrefix: "app:///.webpack",
        include: [".webpack"],
      });
      await cli.releases.setCommits(pkg.version, { auto: true }).catch(e => {
        console.error(e);
        console.log(
          "Sentry setCommits failed – The failure was ignored because " +
            "it can be flawky and it was made optional in our builds. " +
            "We will investigate why and eventually remove this failsafe.",
        );
      });
    },
  },
  {
    title: args.publish
      ? "Bundling and publishing the electron application"
      : "Bundling the electron application",
    task: async () => {
      const commands = ["dist:internal", "--"];
      if (args.dir) commands.push("--dir");
      if (args.nightly) {
        commands.push("--config");
        commands.push("electron-builder-nightly.yml");
      } else if (args.pre) {
        commands.push("--config");
        commands.push("electron-builder-pre.yml");
      } else if (args.nosign) {
        commands.push("--config");
        commands.push("electron-builder-nosign.yml");
        commands.push("-c.afterSign='lodash/noop'");
        commands.push("--publish", "never");
      }

      // Using npm here because pnpm will refuse to rebuild cached modules.
      await exec("npm", ["run", ...commands]);
    },
  },
];

const draftTasks = args => {
  let draft;

  return [
    {
      title: "Health checks",
      task: () => setupList(healthChecksTasks, args),
    },
    {
      title: "Authenticate on GitHub",
      task: ctx => {
        const { repo, tag, token } = ctx;
        draft = new Draft(repo, tag, token);
      },
    },
    {
      title: "Check if draft already exists",
      task: async ctx => {
        ctx.draftExists = await draft.check();
      },
    },
    {
      title: "Create draft on GitHub",
      skip: ctx => (ctx.draftExists ? "Draft already exists." : false),
      task: () => {
        let body = "";
        if (args.nightly) {
          body = process.env.RELEASE_BODY;
        }
        draft.create(body);
      },
    },
  ];
};

const mainTask = (args = {}) => {
  const { dirty, publish } = args;

  const tasks = [
    {
      title: "Health checks",
      enabled: () => !!publish,
      task: () => setupList(healthChecksTasks, args),
    },
    {
      title: "Cleanup",
      skip: () => (dirty ? "--dirty flag passed" : false),
      task: () => setupList(cleaningTasks, args),
    },
    // {
    //   title: "Setup",
    //   skip: () => (dirty ? "--dirty flag passed" : false),
    //   task: () => setupList(setupTasks, args),
    // },
    {
      title: publish ? "Build and publish" : "Build",
      task: () => setupList(buildTasks, args),
    },
  ];

  return tasks;
};

const setupList = (getTasks, args) => {
  verbose = !!args.verbose;

  const tasks = getTasks(args);
  const options = {
    collapse: false,
    renderer: verbose ? verboseRenderer : undefined,
  };

  return new Listr(tasks, options);
};

const runTasks = (getTasks, args) => {
  const listr = setupList(getTasks, args);

  listr.run().catch(error => {
    console.error(error);
    process.exit(-1);
  });
};

yargs
  .usage("Usage: $0 <command> [options]")
  .command(
    ["build", "$0"],
    "bundles the electron app",
    yargs =>
      yargs
        .option("dir", {
          type: "boolean",
          describe: "Build unpacked dir. Useful for tests",
        })
        .option("nightly", {
          alias: "n",
          type: "boolean",
        })
        .option("pre", {
          type: "boolean",
          describe: "make it a prerelease build (doesn't combine with nightly)",
        })
        .option("release", {
          type: "boolean",
          describe: "make it a release build",
        })
        .option("nosign", {
          type: "boolean",
        })
        .option("dirty", {
          type: "boolean",
          describe: "Don't clean-up and rebuild dependencies before building",
        })
        .option("publish", {
          type: "boolean",
          describe: "Publish the created artifacts on GitHub as a draft release",
        }),
    args => runTasks(mainTask, args),
  )
  .command(
    "check",
    "Run health checks",
    () => {},
    args => runTasks(healthChecksTasks, args),
  )
  .command(
    "draft",
    "Prepare release on GitHub",
    yargs =>
      yargs.option("nightly", {
        alias: "n",
        type: "boolean",
        describe: "used to disabled some check for nightly build",
      }),
    args => runTasks(draftTasks, args),
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    describe: "Do not pretty print progress (ncurses) and display output from called commands",
  })
  .help("help")
  .alias("help", "h")
  .strict(true)
  .parse();
