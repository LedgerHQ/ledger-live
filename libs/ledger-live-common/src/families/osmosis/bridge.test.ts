import { setup } from "../../__tests__/test-helpers/libcore-setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import dataset from "./test-dataset";

setup("osmosis");
testBridge("osmosis", dataset);
