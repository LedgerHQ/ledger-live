import { useCallback } from "react";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { openCardTopUp } from "../screens/CardTopUp/CardTopUpDialog";
import { isCardTopUpSupported } from "../utils/isCardTopUpSupported";

export function useCardTopUpEntryPoint(): (asset: CardAssetRow) => void {
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  return useCallback(
    (asset: CardAssetRow) => {
      if (!isCardTopUpSupported(asset)) return;

      openAssetAndAccount({
        currencies: [asset.ledgerId],
        areCurrenciesFiltered: true,
        uiUseCase: "pay-card-top-up",
        onSuccess: (account, parentAccount) => {
          openCardTopUp({ account, parentAccount, asset });
        },
      });
    },
    [openAssetAndAccount],
  );
}
