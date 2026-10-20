import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/fear-and-greed",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
  additionalIgnoreDependencies: [
    "@ledgerhq/lumen-ui-react",
    "@testing-library/dom",
    "@testing-library/jest-dom",
    "@testing-library/react",
    "@types/react-dom",
    "jest-environment-jsdom",
    "react-dom",
  ],
});
