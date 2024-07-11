import json from "./removedMemberEjectedOnDeletedTrustchain.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/removedMemberEjectedOnDeletedTrustchain";
replayTrustchainSdkTests(json, scenario);
