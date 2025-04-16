import { addons } from "@storybook/manager-api";
import ledgerTheme from "./ledgerTheme";

addons.setConfig({
  panelPosition: "right",
  enableShortcuts: true,
  isToolshown: true,
  theme: ledgerTheme,
});
