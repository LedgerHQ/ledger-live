import json from "./twoAddMembersFollowedByDeviceAdd.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/twoAddMembersFollowedByDeviceAdd";
replayTrustchainSdkTests(json, scenario);
