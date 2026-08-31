import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/contacts",
  platform: "web",
  entry: ["src/contactsViewFacade.web.ts", "src/contactsListFacade.web.ts"],
  additionalIgnoreDependencies: ["@shared/ui-qr-code"],
});
