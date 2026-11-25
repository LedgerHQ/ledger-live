import { runKnownDeviceNotAroundTest } from "@e2e/specs/deviceList/deviceList";

const testConfig = {
  tmsLinks: [],
  tags: ["@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runKnownDeviceNotAroundTest(testConfig.tmsLinks, testConfig.tags);
