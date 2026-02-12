import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "~/context/hooks";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
  getParentAccount,
} from "@ledgerhq/live-common/account/helpers";
import { Flex } from "@ledgerhq/native-ui";
import {
  isAccountEmpty,
  getAccountSpendableBalance,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { ScreenName, NavigatorName } from "~/const";
import { accountsSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import AccountSelector from "~/components/AccountSelector";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SafeAreaView from "~/components/SafeAreaView";
import { AccountLike } from "@ledgerhq/types-live";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useNewSendFlowFeature } from "LLM/features/Send/hooks/useNewSendFlowFeature";

type Props = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendCoin>
>;

function ReceiveFunds({ navigation, route }: Props) {
  const {
    selectedCurrency,
    currency: initialCurrencySelected,
    next,
    category,
    notEmptyAccounts,
    minBalance,
  } = route.params || {};

  const [error, setError] = useState<Error | undefined>();

  const accounts = useSelector(accountsSelector);
  const enhancedAccounts = useMemo(() => {
    if (selectedCurrency) {
      const filteredAccounts = accounts.filter(
        acc =>
          acc.currency.id ===
          (selectedCurrency.type === "TokenCurrency"
            ? selectedCurrency.parentCurrency.id
            : selectedCurrency.id),
      );
      if (selectedCurrency.type === "TokenCurrency") {
        // add in the token subAccount if it does not exist
        return flattenAccounts(
          filteredAccounts.map(acc => accountWithMandatoryTokens(acc, [selectedCurrency])),
        ).filter(
          acc =>
            acc.type === "Account" ||
            (acc.type === "TokenAccount" && acc.token.id === selectedCurrency.id),
        );
      }
      return flattenAccounts(filteredAccounts);
    }
    return flattenAccounts(accounts);
  }, [accounts, selectedCurrency]);
  const allAccounts = notEmptyAccounts
    ? enhancedAccounts.filter(account => !isAccountEmpty(account))
    : enhancedAccounts;

  const { isEnabledForFamily, getFamilyFromAccount } = useNewSendFlowFeature();

  const handleSelectAccount = useCallback(
    (account: AccountLike) => {
      const balance = getAccountSpendableBalance(account);

      if (typeof minBalance !== "undefined" && !isNaN(minBalance) && balance.lte(minBalance)) {
        setError(new NotEnoughBalance());
      } else {
        // If navigating to Send flow, check if new flow is enabled for this account's family
        if (next === ScreenName.SendSelectRecipient) {
          const parentAccount = getParentAccount(account, accounts);
          const accountFamily = getFamilyFromAccount(account, parentAccount);
          const shouldUseNewFlow = isEnabledForFamily(accountFamily);

          if (shouldUseNewFlow) {
            const mainAccount = getMainAccount(account, parentAccount);
            navigation.navigate(NavigatorName.SendFlow, {
              params: {
                account,
                parentAccount: mainAccount === account ? undefined : mainAccount,
              },
            });
            return;
          }
        }

        // Determine navigation target for old flows or non-Send flows
        const targetScreen = next || ScreenName.ReceiveConnectDevice;

        // FIXME: Double check if this works because it seems very weird.
        // 1) "next" does not seem to be passed as a param anywhere
        // 2) This component belongs to "SendFundsNavigator", but ReceiveConnectDevice does not.
        //    It belongs to "ReceiveFundsNavigator".
        // Update: next is never passed as a dynamic param, it is only defined as an initial param
        // Thus, next is always defined and the || condition seems to be kinda stupid.
        // @ts-expect-error this seems impossible to type correctly…
        navigation.navigate(targetScreen, {
          ...route.params,
          account,
          accountId: account.id,
          parentId: account.type !== "Account" ? account.parentId : undefined,
        });
      }
    },
    [
      accounts,
      minBalance,
      navigation,
      next,
      route.params,
      isEnabledForFamily,
      getFamilyFromAccount,
    ],
  );

  return (
    <SafeAreaView isFlex edges={["left", "right", "bottom"]}>
      <TrackScreen category={category || ""} name="SelectAccount" />
      <Flex marginX={6} marginTop={6} style={{ flex: 1 }}>
        <AccountSelector
          list={allAccounts}
          onSelectAccount={handleSelectAccount}
          initialCurrencySelected={initialCurrencySelected}
        />
      </Flex>
      {error ? <GenericErrorBottomModal error={error} onClose={() => setError(undefined)} /> : null}
    </SafeAreaView>
  );
}

export default withDiscreetMode(ReceiveFunds);
