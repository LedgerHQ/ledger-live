import json from "./success.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/success";
replayTrustchainSdkTests(json, scenario);
