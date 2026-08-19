import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rootConfig = require("../../../knip.json");

export default {
  ...rootConfig,
  workspaces: {
    ...rootConfig.workspaces,
    "features/flow/flow-contacts-add-address": {
      entry: [
        "src/index.native.ts",
        "src/screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.native.tsx",
      ],
      project: ["src/**/*", "!src/**/*.web.*", "!src/index.ts", "!src/web.ts"],
    },
  },
};
