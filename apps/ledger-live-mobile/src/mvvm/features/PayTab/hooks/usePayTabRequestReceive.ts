import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { toReceiveTarget } from "@features/flow-receive";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { getReceiveSource } from "LLM/features/Receive/utils/getReceiveSource";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { useStore } from "~/context/hooks";

const REQUEST_SOURCE = "pay";
const REQUEST_CATEGORIES: AssetCategory[] = [AssetCategory.Stablecoins];

export type UsePayTabRequestReceive = Readonly<{
  open: () => void;
}>;

/**
 * Request: a stablecoin account, then the receive address screen on it, whatever `newReceiveFlow`
 * says. An account the account model does not know yet opens the legacy receive screen.
 */
export function usePayTabRequestReceive(): UsePayTabRequestReceive {
  const { navigate } = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const { openDrawer } = useModularDrawerController();
  const store = useStore();

  const open = useCallback(() => {
    openDrawer({
      categories: REQUEST_CATEGORIES,
      flow: ModularDrawerLocation.RECEIVE_FLOW,
      source: REQUEST_SOURCE,
      enableAccountSelection: true,
      onAccountSelected: (account, parentAccount) => {
        const currency = getAccountCurrency(account);
        // Token (USDC) may not be in the wallet yet. Use the parent (ETH) id instead.
        const mainAccountId = (account.type !== "Account" && account.parentId) || account.id;
        const assetId = CryptoOrTokenCurrencyIdSchema.safeParse(currency.id);
        const target =
          assetId.success &&
          toReceiveTarget(store.getState().accountEntries, mainAccountId, assetId.data);

        if (!target) {
          navigate(NavigatorName.ReceiveFunds, {
            screen: ScreenName.ReceiveConfirmation,
            params: { accountId: mainAccountId, parentId: parentAccount?.id, currency },
          });
          return;
        }
        navigate(NavigatorName.Receive, {
          screen: ScreenName.ReceiveAddress,
          params: { ...target, source: getReceiveSource() },
        });
      },
    });
  }, [openDrawer, navigate, store]);

  return { open };
}
