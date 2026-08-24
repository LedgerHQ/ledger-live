import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-add-address",
  platform: "web",
  entry: [
    "src/web.ts",
    "src/screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.web.tsx",
    "src/screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.types.web.ts",
    "src/screens/AddressName/components/Input/ContactsAddAddressNameInput.web.tsx",
  ],
});
