import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getRemoteConfig,
  fetchAndActivate,
  ensureInitialized,
  getAll,
  type RemoteConfig,
} from "firebase/remote-config";
import {
  getContentAbTests,
  parseContentAbTests,
  setContentAbTests,
} from "@features/platform-content-ab-tests";
import { getContentAbTestsFirebaseConfig } from "~/firebase-setup";
import logger from "~/renderer/logger";

export { getContentAbTests, subscribeToContentAbTests } from "@features/platform-content-ab-tests";

const CONTENT_AB_TESTS_APP_NAME = "content-ab-tests";

let app: FirebaseApp | null = null;
let remoteConfig: RemoteConfig | null = null;
let setupDone = false;

export async function readCachedContentAbTests() {
  try {
    const rc = getContentAbTestsRemoteConfig();
    await ensureInitialized(rc);
    return setContentAbTests(parseContentAbTests(getAll(rc)));
  } catch {
    return getContentAbTests();
  }
}

export async function fetchContentAbTests() {
  try {
    const rc = getContentAbTestsRemoteConfig();
    await fetchAndActivate(rc);
    const next = parseContentAbTests(getAll(rc));
    if (Object.keys(next).length === 0) {
      logger.info("Content AB tests: no payload");
    } else {
      logger.info("Content AB tests: fetch succeeded", { count: Object.keys(next).length });
    }
    return setContentAbTests(next);
  } catch (error) {
    logger.warn("Content AB tests: fetch failed, keeping app.json defaults", error);
    return getContentAbTests();
  }
}

function getContentAbTestsRemoteConfig(): RemoteConfig {
  if (!app) {
    app = initializeApp(getContentAbTestsFirebaseConfig(), CONTENT_AB_TESTS_APP_NAME);
  }
  if (!remoteConfig) {
    remoteConfig = getRemoteConfig(app);
  }
  if (!setupDone) {
    remoteConfig.settings.minimumFetchIntervalMillis = 0;
    setupDone = true;
  }
  return remoteConfig;
}
