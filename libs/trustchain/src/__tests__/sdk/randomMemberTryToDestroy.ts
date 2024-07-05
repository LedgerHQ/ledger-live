import json from "./randomMemberTryToDestroy.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/randomMemberTryToDestroy";
replayTrustchainSdkTests(json, scenario);
