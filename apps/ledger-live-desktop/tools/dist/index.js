#!/usr/bin/env node
const yargs = require("yargs");
const Listr = require("listr");
const verboseRenderer = require("listr-verbose-renderer");
const path = require("path");
const fs = require("fs");
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

// Shared by `build`, `pack` and `sign`: resolves everything build:js needs
// for the given channel (prerelease shares prod config with release, nightly
// uses staging — matches mobile).
const compileAssetsTask = args => ({
  title: "Compiling assets",
  // MAS re-packages the CDN build's .webpack (build once, package twice) — skip recompile.
  skip: () => (args.mas ? "reusing existing .webpack bundle (--mas)" : false),
  task: async () => {
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
});

// Shared by `build`, `pack` and `sign`: resolves the --config flag and any -c
// overrides for the given release channel, so the three commands can never
// disagree about which electron-builder config (and MAS appId/entitlements)
// a given invocation targets.
const resolveElectronBuilderArgs = args => {
  const configArgs = [];
  const env = {};

  if (args.mas) {
    configArgs.push("--config", "electron-builder-mas.yml");
    // MAS goes to App Store Connect, never the CDN feed.
    configArgs.push("--publish", "never");
    // Injected as -c overrides because electron-builder doesn't expand ${env.X}
    // in these fields (e.g. mas.provisioningProfile reaches `security cms` verbatim).
    const mas = masChannelOverrides(args);
    configArgs.push(`-c.appId=${mas.appId}`);
    if (mas.buildResources) {
      configArgs.push(`-c.directories.buildResources=${mas.buildResources}`);
    }
    if (mas.icon) {
      configArgs.push(`-c.mac.icon=${mas.icon}`);
    }
    // CFBundleVersion: next TestFlight build number for this app id (see CI).
    if (process.env.MAS_BUILD_NUMBER) {
      configArgs.push(`-c.buildVersion=${process.env.MAS_BUILD_NUMBER}`);
    }
    // App Store Connect requires CFBundleShortVersionString as X.Y.Z — drop any pre-release suffix.
    configArgs.push(`-c.mac.bundleShortVersion=${pkg.version.split("-")[0]}`);
    if (process.env.MAS_PROVISIONING_PROFILE_PATH) {
      configArgs.push(`-c.mas.provisioningProfile=${process.env.MAS_PROVISIONING_PROFILE_PATH}`);
    }
    if (process.env.DEVELOPER_TEAM_ID) {
      configArgs.push(`-c.mac.extendInfo.ElectronTeamID=${process.env.DEVELOPER_TEAM_ID}`);
    }
    // For MAS, mark that the mandatory per-channel -c overrides were injected;
    // scripts/afterPack.js refuses any mas build without this sentinel.
    env.LEDGER_MAS_DIST = "1";
  } else if (args.nightly) {
    configArgs.push("--config", "electron-builder-nightly.yml");
  } else if (args.pre) {
    configArgs.push("--config", "electron-builder-pre.yml");
  }

  return { configArgs, env };
};

// Where a given `pack --dir` invocation leaves its output — informational
// only (logged so it's obvious what to hand to `sign --input`); `sign`
// itself always requires an explicit --input.
const resolvePackedAppPath = args => {
  if (process.platform === "darwin") {
    return path.resolve(
      __dirname,
      rootFolder,
      "dist",
      args.mas ? "mas" : "mac",
      `${pkg.productName}.app`,
    );
  }
  if (process.platform === "win32") {
    return path.resolve(__dirname, rootFolder, "dist", "win-unpacked");
  }
  return path.resolve(__dirname, rootFolder, "dist", "linux-unpacked");
};

const buildTasks = args => [
  compileAssetsTask(args),
  {
    title: args.publish
      ? "Bundling and publishing the electron application"
      : "Bundling the electron application",
    task: async () => {
      const commands = ["dist:internal", "--"];
      if (args.dir) commands.push("--dir");

      let channelEnv = {};
      if (args.nosign) {
        commands.push("--config", "electron-builder-nosign.yml");
        commands.push("-c.afterSign='lodash/noop'");
        commands.push("--publish", "never");
      } else {
        const resolved = resolveElectronBuilderArgs(args);
        commands.push(...resolved.configArgs);
        channelEnv = resolved.env;
      }

      // Using npm here because pnpm will refuse to rebuild cached modules.
      const execOptions = Object.keys(channelEnv).length
        ? { env: { ...process.env, ...channelEnv } }
        : {};
      await exec("npm", ["run", ...commands], execOptions);
    },
  },
];

const packTasks = args => [
  compileAssetsTask(args),
  {
    title: "Packaging the electron application (unsigned)",
    task: async () => {
      const { configArgs, env } = resolveElectronBuilderArgs(args);
      const commands = [
        "dist:internal",
        "--",
        "--dir",
        // Mirrors electron-builder-nosign.yml: an unsigned Windows exe fails
        // this check otherwise. Harmless no-op on mac/linux.
        "-c.win.verifyUpdateCodeSignature=false",
        ...configArgs,
      ];
      // MAS already forces --publish never via resolveElectronBuilderArgs.
      if (!args.mas) commands.push("--publish", "never");

      await exec("npm", ["run", ...commands], {
        env: {
          ...process.env,
          ...env,
          // Forces an unsigned build against the *real* channel config:
          // CSC_IDENTITY_AUTO_DISCOVERY skips mac codesigning entirely (so
          // afterSign/notarize.js is never invoked), SKIP_SIGNING makes the
          // Windows signtoolOptions.sign hook (scripts/sign-windows.js) a
          // no-op. Actual signing happens later, in `sign`.
          CSC_IDENTITY_AUTO_DISCOVERY: "false",
          SKIP_SIGNING: "true",
        },
      });

      console.log(`\nPack output ready for \`sign --input\`: ${resolvePackedAppPath(args)}\n`);
    },
  },
];

const signTasks = args => [
  {
    title: args.publish
      ? "Signing and publishing the electron application"
      : "Signing the electron application",
    task: async () => {
      const { configArgs } = resolveElectronBuilderArgs(args);
      const commands = ["dist:internal", "--", "--prepackaged", args.input, ...configArgs];
      // MAS already forces --publish never via resolveElectronBuilderArgs.
      if (!args.mas && !args.publish) commands.push("--publish", "never");

      await exec("npm", ["run", ...commands]);
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

const packMainTask = (args = {}) => {
  const { dirty } = args;

  return [
    {
      title: "Cleanup",
      skip: () => (dirty ? "--dirty flag passed" : false),
      task: () => setupList(cleaningTasks, args),
    },
    {
      title: "Pack",
      task: () => setupList(packTasks, args),
    },
  ];
};

const signMainTask = (args = {}) => [
  {
    title: "Sign",
    task: () => setupList(signTasks, args),
  },
];

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
    "pack",
    "builds and packages the electron app without signing (build:js + unsigned electron-builder pack)",
    yargs =>
      yargs
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
        .option("mas", {
          type: "boolean",
          describe:
            "Package for the Mac App Store. Combine with the channel flag " +
            "(--release/--pre/--nightly) and --dirty to re-use the existing .webpack bundle.",
        })
        .option("dirty", {
          type: "boolean",
          describe: "Don't clean-up and rebuild dependencies before building",
        })
        .check(argv => {
          if (!argv.release && !argv.pre && !argv.nightly) {
            throw new Error("pack requires one of --release, --pre, --nightly");
          }
          return true;
        }),
    args => runTasks(packMainTask, args),
  )
  .command(
    "sign",
    "signs a build produced by `pack` and produces the final distributable(s); does not build or pack",
    yargs =>
      yargs
        .option("input", {
          type: "string",
          describe: "Path to the unsigned app/dir produced by `pack` (required)",
        })
        .option("nightly", {
          alias: "n",
          type: "boolean",
        })
        .option("pre", {
          type: "boolean",
          describe: "sign a prerelease build",
        })
        .option("release", {
          type: "boolean",
          describe: "sign a release build",
        })
        .option("mas", {
          type: "boolean",
          describe:
            "sign a Mac App Store build. Must match the --mas flag `pack` was invoked with.",
        })
        .option("publish", {
          type: "boolean",
          describe: "Publish the signed artifacts on GitHub as a draft release",
        })
        .check(argv => {
          if (!argv.input) {
            throw new Error("sign requires --input <path> (the output of `pack`)");
          }
          if (!fs.existsSync(argv.input)) {
            throw new Error(`sign --input path does not exist: ${argv.input}`);
          }
          if (!argv.release && !argv.pre && !argv.nightly) {
            throw new Error(
              "sign requires one of --release, --pre, --nightly, matching the `pack` invocation",
            );
          }
          return true;
        }),
    args => runTasks(signMainTask, args),
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
