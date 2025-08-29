import { useLeftApyModule as useLeftApyModuleCommon } from "@ledgerhq/live-common/modularDrawer/hooks/modules/useLeftApyModule";
import { ApyIndicator } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export const useLeftApyModule = (assets: CryptoOrTokenCurrency[]) => {
  return useLeftApyModuleCommon(assets, ApyIndicator);
};
