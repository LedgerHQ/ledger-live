import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-add-address",
  platform: "native",
  entry: [
    "src/index.native.ts",
    "src/screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.native.tsx",
  ],
  additionalProjectExcludes: ["src/index.ts", "src/web.ts"],
});
