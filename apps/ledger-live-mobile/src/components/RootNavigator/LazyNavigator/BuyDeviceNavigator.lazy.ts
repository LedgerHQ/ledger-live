import { ScreenName } from "~/const";
import { registerAppScreen } from "LLM/performance/apis";

export const GetFlex = registerAppScreen<
  typeof import("LLM/features/Reborn/screens/UpsellFlex").default
>({
  loader: () => import("LLM/features/Reborn/screens/UpsellFlex"),
  name: ScreenName.GetDevice,
});

export const GetDevice = registerAppScreen<typeof import("~/screens/GetDeviceScreen").default>({
  loader: () => import("~/screens/GetDeviceScreen"),
  name: ScreenName.GetDevice,
});

export const PurchaseDevice = registerAppScreen<typeof import("~/screens/PurchaseDevice").default>({
  loader: () => import("~/screens/PurchaseDevice"),
  name: ScreenName.PurchaseDevice,
});
