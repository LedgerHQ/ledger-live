import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "../../jest.config.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const esmPackages = ["@mysten"];

export default {
  ...baseConfig,
  rootDir: __dirname,
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
