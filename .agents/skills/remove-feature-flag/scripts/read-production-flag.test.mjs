import assert from "node:assert/strict";
import test from "node:test";

import {
  findParameter,
  firebaseKeyForFeatureId,
  parseEnv,
  parseRemoteValue,
  summarizeParameter,
} from "./read-production-flag.mjs";

test("maps feature ids with acronyms and numbers to canonical Firebase keys", () => {
  assert.equal(
    firebaseKeyForFeatureId("ptxSwapReceiveTRC20WithoutTrx"),
    "feature_ptx_swap_receive_trc_20_without_trx",
  );
});

test("parses quoted production environment values", () => {
  const env = parseEnv('# production\nFIREBASE_PROJECT_ID="ledger-live-production"\n');

  assert.equal(env.FIREBASE_PROJECT_ID, "ledger-live-production");
});

test("parses enabled and in-app-default Remote Config values", () => {
  assert.deepEqual(parseRemoteValue({ value: '{"enabled":false}' }), {
    kind: "value",
    value: { enabled: false },
  });
  assert.deepEqual(parseRemoteValue({ useInAppDefault: true }), {
    kind: "in-app-default",
  });
});

test("finds parameters at the root and inside parameter groups", () => {
  const rootTemplate = { parameters: { feature_demo: {} } };
  const groupedTemplate = {
    parameterGroups: {
      Engagement: { parameters: { feature_demo: {} } },
    },
  };

  assert.equal(findParameter(rootTemplate, "feature_demo").parameterGroup, null);
  assert.equal(findParameter(groupedTemplate, "feature_demo").parameterGroup, "Engagement");
  assert.equal(findParameter(rootTemplate, "feature_missing"), null);
});

test("marks a single default value as resolved", () => {
  const summary = summarize({
    parameters: {
      feature_demo: { defaultValue: { value: '{"enabled":false}' } },
    },
  });

  assert.equal(summary.status, "resolved");
  assert.deepEqual(summary.defaultValue.value, { enabled: false });
});

test("marks in-app defaults as unresolved", () => {
  const summary = summarize({
    parameters: {
      feature_demo: { defaultValue: { useInAppDefault: true } },
    },
  });

  assert.equal(summary.status, "unresolved");
});

test("returns condition details without choosing a variant", () => {
  const summary = summarize({
    conditions: [{ name: "internal", expression: "device.country in ['gb']" }],
    parameters: {
      feature_demo: {
        defaultValue: { value: '{"enabled":true}' },
        conditionalValues: {
          internal: { value: '{"enabled":false}' },
        },
      },
    },
  });

  assert.equal(summary.status, "conditional");
  assert.equal(summary.conditionalValues[0].conditionName, "internal");
  assert.deepEqual(summary.conditionalValues[0].resolvedValue.value, {
    enabled: false,
  });
});

function summarize(template) {
  return summarizeParameter({
    template,
    match: findParameter(template, "feature_demo"),
    projectId: "ledger-live-production",
    featureId: "demo",
    firebaseKey: "feature_demo",
  });
}
