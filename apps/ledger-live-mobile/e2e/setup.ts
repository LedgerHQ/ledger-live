import { device } from "detox";
import * as serverBridge from "./bridge/server";

beforeAll(async () => {
  serverBridge.init();

  await device.reverseTcpPort(8081);
  await device.reverseTcpPort(8099);
  await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app

  await device.launchApp({
    languageAndLocale: {
      language: "en-US",
      locale: "en-US",
    },
  });
}, 2000000);

afterAll(async () => {
  serverBridge.close();
});
