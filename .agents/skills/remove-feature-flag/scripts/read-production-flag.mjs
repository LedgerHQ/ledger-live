#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const PRODUCTION_ENV_PATH = path.join(REPO_ROOT, "apps/ledger-live-desktop/.env.production");
const EXPECTED_PROJECT_ID = "ledger-live-production";
const REMOTE_CONFIG_ENDPOINT = "https://firebaseremoteconfig.googleapis.com/v1/projects";

const requireFromDesktop = createRequire(
  path.join(REPO_ROOT, "apps/ledger-live-desktop/package.json"),
);

export function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/u)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#") && line.includes("="))
      .map(line => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/u, "$2");
        return [key, value];
      }),
  );
}

export function firebaseKeyForFeatureId(featureId) {
  const snakeCase = requireFromDesktop("lodash/snakeCase");
  return `feature_${snakeCase(featureId)}`;
}

export function parseRemoteValue(remoteValue) {
  if (!remoteValue) return { kind: "missing" };
  if (remoteValue.useInAppDefault === true) {
    return { kind: "in-app-default" };
  }
  if (!("value" in remoteValue)) return { kind: "missing" };

  try {
    return { kind: "value", value: JSON.parse(remoteValue.value) };
  } catch {
    return { kind: "malformed", rawValue: remoteValue.value };
  }
}

export function findParameter(template, firebaseKey) {
  const direct = template.parameters?.[firebaseKey];
  if (direct) return { parameter: direct, parameterGroup: null };

  for (const [groupName, group] of Object.entries(template.parameterGroups ?? {})) {
    const grouped = group.parameters?.[firebaseKey];
    if (grouped) {
      return { parameter: grouped, parameterGroup: groupName };
    }
  }

  return null;
}

export function summarizeParameter({ template, match, projectId, featureId, firebaseKey }) {
  const conditionalValues = Object.entries(match.parameter.conditionalValues ?? {}).map(
    ([conditionName, remoteValue]) => ({
      conditionName,
      condition: template.conditions?.find(condition => condition.name === conditionName) ?? null,
      resolvedValue: parseRemoteValue(remoteValue),
    }),
  );
  const defaultValue = parseRemoteValue(match.parameter.defaultValue);
  const status =
    conditionalValues.length > 0
      ? "conditional"
      : defaultValue.kind === "value"
        ? "resolved"
        : "unresolved";

  return {
    status,
    source: "firebase-production-template",
    projectId,
    featureId,
    firebaseKey,
    parameterGroup: match.parameterGroup,
    defaultValue,
    conditionalValues,
  };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message, exitCode, details = {}) {
  printJson({ status: "error", message, ...details });
  process.exitCode = exitCode;
}

function getAccessToken() {
  const attempts = [
    ["auth", "application-default", "print-access-token"],
    ["auth", "print-access-token"],
  ];

  for (const args of attempts) {
    try {
      const token = execFileSync("gcloud", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (token) return token;
    } catch {
      continue;
    }
  }

  return null;
}

async function main() {
  const featureId = process.argv[2];
  if (!featureId || featureId === "--help") {
    if (featureId === "--help") {
      process.stdout.write("Usage: node read-production-flag.mjs <FEATURE_ID>\n");
      return;
    }
    fail("FEATURE_ID is required.", 2);
    return;
  }

  let env;
  try {
    env = parseEnv(readFileSync(PRODUCTION_ENV_PATH, "utf8"));
  } catch {
    fail("Production Firebase configuration could not be read.", 2);
    return;
  }

  const projectId = env.FIREBASE_PROJECT_ID;
  if (projectId !== EXPECTED_PROJECT_ID) {
    fail("Refusing to query a non-production Firebase project.", 2, {
      expectedProjectId: EXPECTED_PROJECT_ID,
      configuredProjectId: projectId ?? null,
    });
    return;
  }

  const token = getAccessToken();
  if (!token) {
    fail("No Firebase production read credentials are available.", 3, {
      projectId,
    });
    return;
  }

  const response = await fetch(
    `${REMOTE_CONFIG_ENDPOINT}/${encodeURIComponent(projectId)}/remoteConfig`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    fail("Firebase production Remote Config lookup failed.", 3, {
      projectId,
      httpStatus: response.status,
    });
    return;
  }

  const template = await response.json();
  const firebaseKey = firebaseKeyForFeatureId(featureId);
  const match = findParameter(template, firebaseKey);
  if (!match) {
    fail("Feature flag was not found in Firebase production.", 4, {
      projectId,
      featureId,
      firebaseKey,
    });
    return;
  }

  const result = summarizeParameter({
    template,
    match,
    projectId,
    featureId,
    firebaseKey,
  });

  printJson(result);
  if (result.status === "conditional") process.exitCode = 5;
  if (result.status === "unresolved") process.exitCode = 4;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  main().catch(error => {
    fail("Unexpected Firebase production lookup failure.", 3, {
      error: error instanceof Error ? error.message : String(error),
    });
  });
}
