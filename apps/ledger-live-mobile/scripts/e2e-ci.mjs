#!/usr/bin/env zx
import { basename } from 'path'

const usage = () => {
  console.log(`Usage: ${basename(__filename)} [-h] [-p <ios|android>] [-t] [-b]`);
  process.exit(1);
}

const build_ios = async () => {
  await $`pnpm mobile bundle:ios --dev false --minify false`;
  await $`pnpm mobile exec detox clean-framework-cache`;
  await $`pnpm mobile exec detox build-framework-cache`;
  within(async () => {
    cd('apps/ledger-live-mobile');
    await $`cp main.jsbundle ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app/main.jsbundle`;
    await $`mv main.jsbundle ios/build/Build/Products/Release-iphonesimulator/main.jsbundle`;
  })
}

const build_android = async () => {
  await $`pnpm mobile e2e:build -c android.emu.release`;
}

const test_ios = async () => {
  await $`pnpm mobile e2e:test \
    -c ios.sim.release \
    --loglevel error \
    --record-logs all \
    --take-screenshots all \
    --headless \
    --retries 1 \
    --cleanup \
    --record-performance all`;
}

const test_android = async () => {
  await $`pnpm mobile e2e:test \\
    -c android.emu.release \\
    --loglevel error \\
    --record-logs all \\
    --take-screenshots all \\
    --forceExit \\
    --headless \\
    --retries 1 \\
    --cleanup`;
}

const platformToTask = {
  ios: {
    build: build_ios,
    test: test_ios,
  },
  android: {
    build: build_android,
    test: test_android
  }
}

let platform;
let test, build;

for (const argName in argv) {
  switch (argName) {
    case 'h':
      usage();
      break;
    case 'p':
      if (argv[argName] !== 'ios' && argv[argName] !== 'android') {
        usage()
      } else {
        platform = argv[argName]
      }
      break;
    case 't':
      test = true
      break;
    case 'b':
      build = true;
      break;
    case '_':
      break;
    default:
      usage()
      break;
  }
}

within(async () => {
  cd('../../')

  if (build) {
    await platformToTask[platform].build()
  }
  if (test) {
    await platformToTask[platform].test()
  }
})
