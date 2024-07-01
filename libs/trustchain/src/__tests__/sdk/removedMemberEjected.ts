import json from "./removedMemberEjected.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/removedMemberEjected";
replayTrustchainSdkTests(json, scenario);
