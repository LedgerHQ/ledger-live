import { getFTXLogo } from "./FTX";
import { Changelly } from "./Changelly";
import { Wyre } from "./Wyre";

export { Paraswap } from "./Paraswap";

export const providerIcons = {
  changelly: Changelly,
  ftx: getFTXLogo(),
  ftxus: getFTXLogo(true),
  wyre: Wyre,
};
