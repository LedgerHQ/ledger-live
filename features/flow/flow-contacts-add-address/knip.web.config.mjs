import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rootConfig = require("../../../knip.json");

export default {
  ...rootConfig,
  workspaces: {
    ...rootConfig.workspaces,
    "features/flow/flow-contacts-add-address": {
      entry: [
        "src/web.ts",
        "src/screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.web.tsx",
        "src/screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.types.web.ts",
        "src/screens/AddressName/components/Input/ContactsAddAddressNameInput.web.tsx",
      ],
      project: ["src/**/*", "!src/**/*.native.*"],
    },
  },
};
