#!/usr/bin/env node
const yargs = require("yargs");
const Listr = require("listr");
const verboseRenderer = require("listr-verbose-renderer");
const path = require("path");
const rimraf = require("rimraf");
const pkg = require("../../package.json");
const healthChecksTasks = require("./health-checks");

require("dotenv").config();

let execa;

const rootFolder = "../../";
const defaultDatadogSite = "datadoghq.eu";
let verbose = false;

const exec = async (file, args, options = {}) => {
  if (!execa) {
    await import("execa").then(mod => {
      execa = mod.execa;
    });
  }
  const opts = verbose ? { stdio: "inherit", ...options } : options;

  return execa(file, args, opts);
};

const rmDir = dir => {
  const fullPath = path.resolve(__dirname, rootFolder, dir);
  return rimraf(fullPath);
};

const cleaningTasks = _args => [
  {
    title: "Remove `.cache/desktop-native-deps` folder",
    task: () => rmDir(".cache/desktop-native-deps"),
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

// Per-channel MAS deltas, injected as -c overrides onto the single
// electron-builder-mas.yml. appId isolates each channel's App Store Connect app.
const masChannelOverrides = args => {
  if (args.nightly)
    return {
      appId: "com.ledger.live.nightly",
      buildResources: "build-nightly",
      icon: "build-nightly/icon.icns",
    };
  if (args.pre)
    return {
      appId: "com.ledger.live.prerelease",
      buildResources: "build-rc",
      icon: "build-rc/icon.icns",
    };
  return { appId: "com.ledger.live" };
};

const buildTasks = args => [
  {
    title: "Compiling assets",
    // MAS re-packages the CDN build's .webpack (build once, package twice) — skip recompile.
    skip: () => (args.mas ? "reusing existing .webpack bundle (--mas)" : false),
    task: async () => {
      // Matches mobile: prerelease (--pre) shares prod config with release,
      // nightly uses staging.
      if (args.release || args.pre) {
        require("dotenv").config({
          path: path.resolve(__dirname, rootFolder, ".env.production"),
        });
      } else if (args.nightly) {
        require("dotenv").config({
          path: path.resolve(__dirname, rootFolder, ".env.staging"),
        });
      }
      const baseEnv = args.release
        ? {
            DATADOG_APPLICATION_ID: process.env.DATADOG_APPLICATION_ID,
            DATADOG_CLIENT_TOKEN: process.env.DATADOG_CLIENT_TOKEN,
            DATADOG_SITE: process.env.DATADOG_SITE || defaultDatadogSite,
            DATADOG_ENV: "production",
          }
        : args.pre
          ? {
              DATADOG_APPLICATION_ID: process.env.DATADOG_APPLICATION_ID,
              DATADOG_CLIENT_TOKEN: process.env.DATADOG_CLIENT_TOKEN,
              DATADOG_SITE: process.env.DATADOG_SITE || defaultDatadogSite,
              DATADOG_ENV: "staging",
            }
          : args.nightly
            ? {
                // Required for tools/rspack/utils.ts to pick .env.staging.
                STAGING: "1",
                DATADOG_APPLICATION_ID: process.env.DATADOG_APPLICATION_ID,
                DATADOG_CLIENT_TOKEN: process.env.DATADOG_CLIENT_TOKEN,
                DATADOG_SITE: process.env.DATADOG_SITE || defaultDatadogSite,
                DATADOG_ENV: "nightly",
              }
            : {};
      await exec("pnpm", ["run", "build:js"], { env: { ...process.env, ...baseEnv } });
    },
  },
  {
    title: args.publish
      ? "Bundling and publishing the electron application"
      : "Bundling the electron application",
    task: async () => {
      const commands = ["dist:internal", "--"];
      if (args.dir) commands.push("--dir");
      if (args.mas) {
        commands.push("--config", "electron-builder-mas.yml");
        // MAS goes to App Store Connect, never the CDN feed.
        commands.push("--publish", "never");
        // Injected as -c overrides because electron-builder doesn't expand ${env.X}
        // in these fields (e.g. mas.provisioningProfile reaches `security cms` verbatim).
        const mas = masChannelOverrides(args);
        commands.push(`-c.appId=${mas.appId}`);
        if (mas.buildResources) {
          commands.push(`-c.directories.buildResources=${mas.buildResources}`);
        }
        if (mas.icon) {
          commands.push(`-c.mac.icon=${mas.icon}`);
        }
        // CFBundleVersion: next TestFlight build number for this app id (see CI).
        if (process.env.MAS_BUILD_NUMBER) {
          commands.push(`-c.buildVersion=${process.env.MAS_BUILD_NUMBER}`);
        }
        // App Store Connect requires CFBundleShortVersionString as X.Y.Z — drop any pre-release suffix.
        commands.push(`-c.mac.bundleShortVersion=${pkg.version.split("-")[0]}`);
        if (process.env.MAS_PROVISIONING_PROFILE_PATH) {
          commands.push(`-c.mas.provisioningProfile=${process.env.MAS_PROVISIONING_PROFILE_PATH}`);
        }
        if (process.env.DEVELOPER_TEAM_ID) {
          commands.push(`-c.mac.extendInfo.ElectronTeamID=${process.env.DEVELOPER_TEAM_ID}`);
        }
      } else if (args.nightly) {
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
      // For MAS, mark that the mandatory per-channel -c overrides were injected;
      // scripts/afterPack.js refuses any mas build without this sentinel.
      const execOptions = args.mas ? { env: { ...process.env, LEDGER_MAS_DIST: "1" } } : {};
      await exec("npm", ["run", ...commands], execOptions);
    },
  },
];

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
        .option("mas", {
          type: "boolean",
          describe:
            "Package for the Mac App Store (.pkg). Combine with the channel flag " +
            "(--release/--pre/--nightly) and --dirty to re-use the existing .webpack bundle.",
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
    () => {
      // ignore
    },
    args => runTasks(healthChecksTasks, args),
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
