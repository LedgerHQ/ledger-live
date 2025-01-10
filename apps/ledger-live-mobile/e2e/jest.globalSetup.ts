const detoxGlobalSetup = require("detox/runners/jest/globalSetup");
import detox from "detox/internals";

const shouldManageDetox = detox.getStatus() === "inactive";

export default async () => {
  await detoxGlobalSetup();

  try {
    await initDetox();
    const { device } = require("detox");
    await device.installApp();
    await cleanupDetox();
  } catch (e) {
    console.error("Error during global setup", e);
    await cleanupDetox();
  }
};

async function initDetox() {
  if (detox.session.unsafe_earlyTeardown) {
    throw new Error("Detox halted test execution due to an early teardown request");
  }

  const opts = {
    workerId: `w${process.env.JEST_WORKER_ID}`,
  };

  if (shouldManageDetox) {
    await detox.init(opts);
  } else {
    await detox.installWorker(opts);
  }

  return detox.worker;
}

async function cleanupDetox() {
  if (shouldManageDetox) {
    await detox.cleanup();
  } else {
    await detox.uninstallWorker();
  }
}
