#!/usr/bin/env node
// Fetches the production Firebase Remote Config as seen by each app preset.
// Uses the public client API keys shipped in the apps, the same way the SDKs do:
// register a Firebase installation, then call the client fetch endpoint.
// Usage: node fetch-remote-config.mjs <outDir>
import fs from "node:fs";
import path from "node:path";
import { PRESETS, PROJECT_ID, REPO_ROOT } from "./presets.mjs";

const outDir = path.resolve(process.argv[2] ?? "out");
fs.mkdirSync(path.join(outDir, "remote"), { recursive: true });

async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json.error?.message ?? JSON.stringify(json);
    throw new Error(`${res.status} ${url.split("?")[0]}: ${message}`);
  }
  return json;
}

for (const preset of PRESETS) {
  const { name, fid, appId, apiKey, headers, fetchParams } = preset.resolve(REPO_ROOT);

  const installation = await postJson(
    `https://firebaseinstallations.googleapis.com/v1/projects/${PROJECT_ID}/installations`,
    { "x-goog-api-key": apiKey, ...headers },
    { fid, appId, authVersion: "FIS_v2", sdkVersion: "w:0.6.0" },
  );

  const response = await postJson(
    `https://firebaseremoteconfig.googleapis.com/v1/projects/${PROJECT_ID}/namespaces/firebase:fetch?key=${apiKey}`,
    headers,
    {
      appInstanceId: fid,
      appInstanceIdToken: installation.authToken.token,
      appId,
      languageCode: "en-US",
      timeZone: "UTC",
      ...fetchParams,
    },
  );

  if (!response.entries || typeof response.entries !== "object") {
    throw new Error(`${name}: unexpected response shape (state=${response.state})`);
  }

  const result = {
    meta: {
      preset: name,
      projectId: PROJECT_ID,
      appId,
      ...fetchParams,
      fetchedAt: new Date().toISOString(),
      templateVersion: response.templateVersion,
      state: response.state,
    },
    entries: response.entries,
  };
  fs.writeFileSync(path.join(outDir, "remote", `${name}.json`), JSON.stringify(result, null, 2));
  console.log(
    `${name}: template ${response.templateVersion}, ${
      Object.keys(response.entries).length
    } entries`,
  );
}
