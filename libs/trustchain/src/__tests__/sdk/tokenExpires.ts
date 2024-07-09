import json from "./tokenExpires.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/tokenExpires";
replayTrustchainSdkTests(json, scenario);
