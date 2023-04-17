import { device } from "detox";
import * as serverBridge from "./bridge/server";

beforeAll(async () => {
  serverBridge.init();

  await device.reverseTcpPort(8081);
  await device.reverseTcpPort(8099);

  await device.launchApp({
    languageAndLocale: {
      language: "en-US",
      locale: "en-US",
    },
  });
}, 350000);

afterAll(async () => {
  serverBridge.close();
});
