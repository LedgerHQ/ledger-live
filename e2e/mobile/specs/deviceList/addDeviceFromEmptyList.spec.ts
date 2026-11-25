import { runAddDeviceFromEmptyListTest } from "@e2e/specs/deviceList/deviceList";

const testConfig = {
  tmsLinks: ["B2CQA-657"],
  tags: ["@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runAddDeviceFromEmptyListTest(testConfig);
