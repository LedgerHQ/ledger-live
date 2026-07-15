import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { getCustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";
import { useNewSendFlowFeature } from "./useNewSendFlowFeature";

type UseOpenSendFlowProps = Readonly<{
  currency?: CryptoOrTokenCurrency;
  currencyIds?: string[];
  sourceScreenName: string;
}>;

export function useOpenSendFlow({ currency, currencyIds, sourceScreenName }: UseOpenSendFlowProps) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { openDrawer } = useModularDrawerController();
  const { isEnabledForFamily, getFamilyFromAccount, getCurrencyIdFromAccount } =
    useNewSendFlowFeature();

  const navigateToLegacyRecipient = useCallback(
    (account: AccountLike) => {
      navigation.navigate(NavigatorName.SendFunds, {
        screen: ScreenName.SendSelectRecipient,
        params: {
          accountId: account.id,
          parentId: account.type === "TokenAccount" ? account.parentId : undefined,
        },
      });
    },
    [navigation],
  );

  const navigateAfterAccountSelection = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      if (account.type === "TokenAccount" && !parentAccount) {
        navigateToLegacyRecipient(account);
        return;
      }

      const family = getFamilyFromAccount(account, parentAccount);
      const currencyId = getCurrencyIdFromAccount(account, parentAccount);
      const mainAccount = getMainAccount(account, parentAccount ?? null);

      if (isEnabledForFamily(family, currencyId)) {
        navigation.navigate(NavigatorName.SendFlow, {
          params: {
            account,
            parentAccount: mainAccount === account ? undefined : mainAccount,
            fromMAD: true,
          },
        });
        return;
      }

      const customEntrypoint = family
        ? getCustomSendFlow(family)?.buildSendEntrypoint?.({
            account,
            parentAccount: mainAccount === account ? undefined : mainAccount,
          })
        : undefined;

      if (customEntrypoint) {
        navigation.navigate(
          NavigatorName.SendFunds,
          customEntrypoint as NavigatorScreenParams<SendFundsNavigatorStackParamList>,
        );
        return;
      }

      navigateToLegacyRecipient(account);
    },
    [
      getCurrencyIdFromAccount,
      getFamilyFromAccount,
      isEnabledForFamily,
      navigateToLegacyRecipient,
      navigation,
    ],
  );

  const handleOpenSendFlow = useCallback(() => {
    const hasCurrencyIds = Boolean(currencyIds?.length);
    openDrawer({
      currencies: hasCurrencyIds ? currencyIds : currency ? [currency.id] : [],
      flow: "send",
      source: sourceScreenName,
      areCurrenciesFiltered: hasCurrencyIds || Boolean(currency),
      enableAccountSelection: true,
      onAccountSelected: navigateAfterAccountSelection,
    });
  }, [currency, currencyIds, navigateAfterAccountSelection, openDrawer, sourceScreenName]);

  return { handleOpenSendFlow };
}
