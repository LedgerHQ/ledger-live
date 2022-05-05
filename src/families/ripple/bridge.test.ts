import { setup } from "../../__tests__/test-helpers/libcore-setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import dataset from "./test-dataset";
import { disconnect } from "../../api/Ripple";

// Disconnect all api clients that could be open.
afterAll(async () => {
  await disconnect();
});

setup("ripple");
testBridge("ripple", dataset);
