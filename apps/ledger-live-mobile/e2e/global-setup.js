import detox from "detox";

async function globalSetup() {
  await detox.globalInit();
}

export default globalSetup;
