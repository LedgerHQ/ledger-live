import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "../../jest.config.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const esmPackages = ["@mysten"];

export default {
  ...baseConfig,
  rootDir: __dirname,
  // No @ledgerhq/test-quarantine dependency: drop its reporter and retries.
  reporters: baseConfig.reporters.filter(reporter => reporter !== "@ledgerhq/test-quarantine/jest"),
  setupFilesAfterEnv: [],
  transform: {
    ...baseConfig.transform,
    [`node_modules/.pnpm/(${esmPackages.join("|")}).+\\.(js|mjs)?$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${esmPackages.join("|")}))`],
};
