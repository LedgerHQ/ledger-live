import json from "./membersManySelfAdd.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/membersManySelfAdd";
replayTrustchainSdkTests(json, scenario);
