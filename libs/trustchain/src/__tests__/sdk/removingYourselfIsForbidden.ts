import json from "./removingYourselfIsForbidden.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/removingYourselfIsForbidden";
replayTrustchainSdkTests(json, scenario);
