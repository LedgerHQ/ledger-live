import { useCallback } from "react";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { openCardFund } from "../screens/CardFund/CardFundDialog";

export function useCardFundEntryPoint(): (asset: CardAssetRow) => void {
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  return useCallback(
    (asset: CardAssetRow) => {
      if (!asset.ledgerId) return;

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
