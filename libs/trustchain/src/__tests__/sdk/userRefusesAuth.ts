import json from "./userRefusesAuth.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/userRefusesAuth";
replayTrustchainSdkTests(json, scenario);
