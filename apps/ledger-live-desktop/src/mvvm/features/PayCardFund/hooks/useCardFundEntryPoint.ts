import { useCallback } from "react";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { openCardFund } from "../screens/CardFund/CardFundDialog";
import { isCardFundSupported } from "../utils/isCardFundSupported";

export function useCardFundEntryPoint(): (asset: CardAssetRow) => void {
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  return useCallback(
    (asset: CardAssetRow) => {
      if (!isCardFundSupported(asset)) return;

      openAssetAndAccount({
        currencies: [asset.ledgerId],
        areCurrenciesFiltered: true,
        uiUseCase: "pay-card-fund",
        onSuccess: (account, parentAccount) => {
          openCardFund({ account, parentAccount, asset });
        },
      });
    },
    [openAssetAndAccount],
  );
}
