import json from "./removingAMemberCreatesAnInteraction.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/removingAMemberCreatesAnInteraction";
replayTrustchainSdkTests(json, scenario);
