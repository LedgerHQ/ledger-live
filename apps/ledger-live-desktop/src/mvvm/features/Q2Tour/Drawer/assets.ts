import welcomeDark from "./assets/dark/Q2_PRODUCT_TOUR_DARK_MODE_WELCOME.webp";
import aggregatedBalanceDark from "./assets/dark/Q2_PRODUCT_TOUR_DARK_MODE_ASSET_AGREGATION.webp";
import pnlDark from "./assets/dark/Q2_PRODUCT_TOUR_DARK_MODE_P_L.webp";
import earnSimulatorDark from "./assets/dark/Q2_PRODUCT_TOUR_DARK_MODE_EARN_SIMULATOR.webp";
import earnUpsellingDark from "./assets/dark/Q2_PRODUCT_TOUR_DARK_MODE_UPSELLING.webp";

import welcomeLight from "./assets/light/Q2_PRODUCT_TOUR_LIGHT_MODE_WELCOME.webp";
import aggregatedBalanceLight from "./assets/light/Q2_PRODUCT_TOUR_LIGHT_MODE_ASSET_AGREGATION.webp";
import pnlLight from "./assets/light/Q2_PRODUCT_TOUR_LIGHT_MODE_P_L.webp";
import earnSimulatorLight from "./assets/light/Q2_PRODUCT_TOUR_LIGHT_MODE_EARN_SIMULATOR.webp";
import earnUpsellingLight from "./assets/light/Q2_PRODUCT_TOUR_LIGHT_MODE_UPSELLING.webp";

export const SLIDE_IMAGES = {
  dark: [welcomeDark, aggregatedBalanceDark, pnlDark, earnSimulatorDark, earnUpsellingDark],
  light: [welcomeLight, aggregatedBalanceLight, pnlLight, earnSimulatorLight, earnUpsellingLight],
} as const;
