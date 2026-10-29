import { useSelector } from "LLD/hooks/redux";
import type { Account } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { useLLDCoinFamily } from "~/renderer/families";
import type { LLDCoinFamily } from "~/renderer/families/types";
import { counterValueCurrencySelector, discreetModeSelector } from "~/renderer/reducers/settings";

type FamilyComponents = Pick<
  LLDCoinFamily<Account, never, never, never>,
  | "AccountSubHeader"
  | "PendingTransferProposals"
  | "AccountBodyHeader"
  | "AccountDetailDelegations"
  | "AccountBalanceSummaryFooter"
>;

export type FamilyBlocksViewModel = Readonly<{
  account: Account;
  family: FamilyComponents;
  counterValue: Currency;
  discreetMode: boolean;
  showBalanceSummaryFooter: boolean;
  showBodyBlocks: boolean;
}>;

export const useFamilyBlocksViewModel = (
  account: Account,
  currencyConfig: CurrencyConfig | undefined,
): FamilyBlocksViewModel => {
  const family = useLLDCoinFamily<Account, never, never, never>(account.currency.family);
  const bridge = useAccountBridgeOrNull(account, undefined);
  const counterValue = useSelector(counterValueCurrencySelector);
  const discreetMode = useSelector(discreetModeSelector);
  const isDelegationDisabled = currencyConfig?.disableDelegation === true;

  const isEmpty = bridge ? bridge.isAccountEmpty(account) : true;

  return {
    account,
    family,
    counterValue,
    discreetMode,
    showBalanceSummaryFooter: !isEmpty && !isDelegationDisabled,
    showBodyBlocks: !isEmpty,
  };
};
