import json from "./getOrCreateTransactionCases.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/getOrCreateTransactionCases";
replayTrustchainSdkTests(json, scenario);
