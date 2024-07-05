import json from "./create2trustchainInARow.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/create2trustchainInARow";
replayTrustchainSdkTests(json, scenario);
