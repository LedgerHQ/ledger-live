import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-edit-address",
  platform: "native",
  entry: ["src/index.native.ts", "src/ContactsRenameAddressDrawer.native.tsx"],
  additionalProjectExcludes: ["src/index.ts"],
});
