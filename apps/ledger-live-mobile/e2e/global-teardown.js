import detox from "detox";

async function globalTeardown() {
  await detox.globalCleanup();
}

export default globalTeardown;
