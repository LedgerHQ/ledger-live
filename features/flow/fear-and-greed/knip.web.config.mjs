import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/fear-and-greed",
  platform: "web",
  entry: [],
  additionalIgnoreDependencies: [
    "@ledgerhq/lumen-ui-rnative",
    "@shared/ui-queued-bottom-sheet",
    "@testing-library/react-native",
    "react-native",
    "react-native-safe-area-context",
    "react-test-renderer",
  ],
});
