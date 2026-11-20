import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/receive",
  platform: "native",
  entry: [],
  // Until the mobile buttons (LIVE-41217) render them, only the web tiles use this contract.
  additionalProjectExcludes: ["src/screens/ReceiveAddress/components/AddressActions.types.ts"],
});
