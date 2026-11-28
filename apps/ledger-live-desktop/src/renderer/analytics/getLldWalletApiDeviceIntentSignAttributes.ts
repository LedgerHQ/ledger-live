import type { Feature, Features } from "@shared/feature-flags";

type LldWalletApiDeviceIntentSignFlag =
  | Feature<Features["lldWalletApiDeviceIntentSign"]["params"]>
  | null
  | undefined;

export function getLldWalletApiDeviceIntentSignAttributes(flag: LldWalletApiDeviceIntentSignFlag): {
  lldWalletApiDeviceIntentSignEnabled: boolean;
  lldWalletApiDeviceIntentSignVariant: string | undefined;
} {
  return {
    lldWalletApiDeviceIntentSignEnabled: flag?.enabled ?? false,
    lldWalletApiDeviceIntentSignVariant: flag?.params?.variantId,
  };
}
