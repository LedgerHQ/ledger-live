import json from "./removedMemberEjectedOnRestore.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/removedMemberEjectedOnRestore";
replayTrustchainSdkTests(json, scenario);
