import json from "./removedMemberEjectedOnGetMembers.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/removedMemberEjectedOnGetMembers";
replayTrustchainSdkTests(json, scenario);
