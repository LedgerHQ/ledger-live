import json from "./removeMemberWithTheWrongSeed.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/removeMemberWithTheWrongSeed";
replayTrustchainSdkTests(json, scenario);
