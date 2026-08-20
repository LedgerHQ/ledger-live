import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { getCustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";
import { useNewSendFlowFeature } from "./useNewSendFlowFeature";

type OpenSendFlowOverride = Readonly<{
  currencyIds?: string[];
  recipient?: string;
  skipRecipientStep?: boolean;
}>;

type UseOpenSendFlowProps = Readonly<{
  currency?: CryptoOrTokenCurrency;
  currencyIds?: string[];
  recipient?: string;
  skipRecipientStep?: boolean;
  sourceScreenName: string;
}>;

export function useOpenSendFlow({
  currency,
  currencyIds,
  recipient,
  skipRecipientStep,
  sourceScreenName,
}: UseOpenSendFlowProps) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { openDrawer } = useModularDrawerController();
  const { isEnabledForFamily, getFamilyFromAccount, getCurrencyIdFromAccount } =
    useNewSendFlowFeature();

  const navigateToLegacyRecipient = useCallback(
    async (
      account: AccountLike,
      parentAccount?: Account,
      prefilledRecipient?: string,
      skipRecipientStep?: boolean,
    ) => {
      const params: SendFundsNavigatorStackParamList[typeof ScreenName.SendSelectRecipient] = {
        accountId: account.id,
        parentId: account.type === "TokenAccount" ? account.parentId : undefined,
      };

      const canPrefillRecipient = Boolean(
        prefilledRecipient && !(account.type === "TokenAccount" && !parentAccount),
      );

      if (canPrefillRecipient && prefilledRecipient) {
        try {
          const bridge = await getAccountBridge(account, parentAccount);
          const mainAccount = getMainAccount(account, parentAccount ?? null);
          const subAccountId = account.type !== "Account" ? account.id : undefined;
          let transaction = await bridge.createTransaction(mainAccount);

          if (subAccountId) {
            transaction = { ...transaction, subAccountId };
          }

          params.transaction = bridge.updateTransaction(transaction, {
            recipient: prefilledRecipient,
          });
        } catch {
          // Fall back to navigating without a prefilled transaction.
        }
      }

      if (skipRecipientStep && params.transaction) {
        navigation.navigate(NavigatorName.SendFunds, {
          screen: ScreenName.SendAmountCoin,
          params: {
            accountId: account.id,
            parentId: account.type === "TokenAccount" ? account.parentId : undefined,
            transaction: params.transaction,
          },
        });
        return;
      }

      navigation.navigate(NavigatorName.SendFunds, {
        screen: ScreenName.SendSelectRecipient,
        params,
      });
    },
    [navigation],
  );

  const navigateAfterAccountSelection = useCallback(
    (
      account: AccountLike,
      parentAccount?: Account,
      prefilledRecipient?: string,
      skipRecipientStep?: boolean,
    ) => {
      if (account.type === "TokenAccount" && !parentAccount) {
        void navigateToLegacyRecipient(
          account,
          parentAccount,
          prefilledRecipient,
          skipRecipientStep,
        );
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
            recipient: prefilledRecipient,
            skipRecipientStep,
          },
        });
        return;
      }

      const customEntrypoint = family
        ? getCustomSendFlow(family)?.buildSendEntrypoint?.({
            account,
            parentAccount: mainAccount === account ? undefined : mainAccount,
            recipient: prefilledRecipient,
            skipRecipientStep,
          })
        : undefined;

      if (customEntrypoint) {
        navigation.navigate(
          NavigatorName.SendFunds,
          customEntrypoint as NavigatorScreenParams<SendFundsNavigatorStackParamList>,
        );
        return;
      }

      void navigateToLegacyRecipient(account, parentAccount, prefilledRecipient, skipRecipientStep);
    },
    [
      getCurrencyIdFromAccount,
      getFamilyFromAccount,
      isEnabledForFamily,
      navigateToLegacyRecipient,
      navigation,
    ],
  );

  const handleOpenSendFlow = useCallback(
    (override?: OpenSendFlowOverride) => {
      const resolvedCurrencyIds = override?.currencyIds ?? currencyIds;
      const resolvedRecipient = override?.recipient ?? recipient;
      const resolvedSkipRecipientStep = override?.skipRecipientStep ?? skipRecipientStep;
      const hasCurrencyIds = Boolean(resolvedCurrencyIds?.length);
      openDrawer({
        currencies: hasCurrencyIds ? resolvedCurrencyIds : currency ? [currency.id] : [],
        flow: "send",
        source: sourceScreenName,
        areCurrenciesFiltered: hasCurrencyIds || Boolean(currency),
        enableAccountSelection: true,
        onAccountSelected: (account, parentAccount) =>
          navigateAfterAccountSelection(
            account,
            parentAccount,
            resolvedRecipient,
            resolvedSkipRecipientStep,
          ),
      });
    },
    [
      currency,
      currencyIds,
      navigateAfterAccountSelection,
      openDrawer,
      recipient,
      skipRecipientStep,
      sourceScreenName,
    ],
  );

  return { handleOpenSendFlow };
}
