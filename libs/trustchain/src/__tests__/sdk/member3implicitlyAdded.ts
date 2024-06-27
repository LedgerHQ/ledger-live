import json from "./member3implicitlyAdded.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/member3implicitlyAdded";
replayTrustchainSdkTests(json, scenario);
