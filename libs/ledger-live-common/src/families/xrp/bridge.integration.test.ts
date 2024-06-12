import "../../__tests__/test-helpers/setup";
import { newAddress1, dataset } from "@ledgerhq/coin-xrp/datasets/dataset-1";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { addNotCreatedRippleMockAddress } from "./bridge/mock";

addNotCreatedRippleMockAddress(newAddress1);

testBridge(dataset);
