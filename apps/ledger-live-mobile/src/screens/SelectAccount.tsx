import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "~/context/hooks";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
  getParentAccount,
} from "@ledgerhq/live-common/account/helpers";
import { Flex } from "@ledgerhq/native-ui";
import { getAccountSpendableBalance, getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAccountBridgeMany } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { ScreenName, NavigatorName } from "~/const";
import { accountsSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import AccountSelector from "~/components/AccountSelector";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SafeAreaView from "~/components/SafeAreaView";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useNewSendFlowFeature } from "LLM/features/Send/hooks/useNewSendFlowFeature";

type Props = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendCoin>
>;

function ReceiveFunds({ navigation, route }: Props) {
  const {
    selectedCurrency,
    currency: initialCurrencySelected,
    currencyIds,
    next,
    category,
    notEmptyAccounts,
    minBalance,
  } = route.params || {};

  const [error, setError] = useState<Error | undefined>();

  const accounts = useSelector(accountsSelector);
  const enhancedAccounts = useMemo(() => {
    // Filter by an explicit list of ledger currency ids: keeps every account
    // (token sub-accounts included) holding one of the asset's networks, so a
    // multi-network asset (e.g. USDT on Ethereum + Tron) shows all its accounts.
    if (currencyIds?.length) {
      const idSet = new Set(currencyIds);
      return flattenAccounts(accounts).filter(acc =>
        idSet.has(acc.type === "TokenAccount" ? acc.token.id : acc.currency.id),
      );
    }
    if (selectedCurrency) {
      const filteredAccounts = accounts.filter(
        acc =>
          acc.currency.id ===
          (selectedCurrency.type === "TokenCurrency"
            ? selectedCurrency.parentCurrencyId
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
  }, [accounts, selectedCurrency, currencyIds]);
  // Resolve the parent (main) accounts of everything displayed — including token
  // sub-accounts whose parent is not itself in the list (the `currencyIds` case)
  // — so the `notEmptyAccounts` filter below can read each account's bridge.
  const parentAccountIds = new Set(
    enhancedAccounts.map(a => (a.type === "Account" ? a.id : a.parentId)),
  );
  const mainAccounts = accounts.filter((a): a is Account => parentAccountIds.has(a.id));
  const bridges = useAccountBridgeMany(mainAccounts);
  const bridgeById = new Map(mainAccounts.map((a, i) => [a.id, bridges[i]]));
  const allAccounts = notEmptyAccounts
    ? enhancedAccounts.filter(
        a => !bridgeById.get(a.type === "Account" ? a.id : a.parentId)?.isAccountEmpty(a),
      )
    : enhancedAccounts;

  const { isEnabledForFamily, getFamilyFromAccount, getCurrencyIdFromAccount } =
    useNewSendFlowFeature();

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
          const accountCurrencyId = getCurrencyIdFromAccount(account, parentAccount);
          const shouldUseNewFlow = isEnabledForFamily(accountFamily, accountCurrencyId);

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
      getCurrencyIdFromAccount,
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
