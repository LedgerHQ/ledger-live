import json from "./userRefusesRemoveMember.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/userRefusesRemoveMember";
replayTrustchainSdkTests(json, scenario);
