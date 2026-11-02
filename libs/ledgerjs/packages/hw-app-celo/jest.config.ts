import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "../../jest.config.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  ...baseConfig,
  rootDir: __dirname,
  // No @ledgerhq/test-quarantine dependency: drop its reporter and retries.
  reporters: baseConfig.reporters.filter(reporter => reporter !== "@ledgerhq/test-quarantine/jest"),
  setupFilesAfterEnv: [],
};
