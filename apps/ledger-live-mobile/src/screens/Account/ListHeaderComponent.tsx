import React, { ReactNode } from "react";
import {
  isAccountEmpty,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import {
  AccountLike,
  Account,
  Currency,
  TokenAccount,
} from "@ledgerhq/live-common/lib/types";
import { ValueChange } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";

import { Box } from "@ledgerhq/native-ui";
import { isNFTActive } from "@ledgerhq/live-common/lib/nft";

import { DebouncedFunc } from "lodash";
import Header from "./Header";
import AccountGraphCard from "../../components/AccountGraphCard";
import SubAccountsList from "./SubAccountsList";
import NftCollectionsList from "./NftCollectionsList";
import CompoundSummary from "../Lending/Account/CompoundSummary";
import CompoundAccountBodyHeader from "../Lending/Account/AccountBodyHeader";
import perFamilyAccountHeader from "../../generated/AccountHeader";
import perFamilyAccountSubHeader from "../../generated/AccountSubHeader";
import perFamilyAccountBodyHeader from "../../generated/AccountBodyHeader";
import perFamilyAccountBalanceSummaryFooter from "../../generated/AccountBalanceSummaryFooter";
import { FabAccountActions } from "../../components/FabActions";

const renderAccountSummary = (
  account: AccountLike,
  parentAccount: Account | undefined | null,
  compoundSummary: CompoundAccountSummary | undefined | null,
) => () => {
  const mainAccount = getMainAccount(account, parentAccount);
  const AccountBalanceSummaryFooter =
    perFamilyAccountBalanceSummaryFooter[
      mainAccount.currency
        .family as keyof typeof perFamilyAccountBalanceSummaryFooter
    ];

  const footers = [];

  if (compoundSummary && account.type === "TokenAccount") {
    footers.push(
      <CompoundSummary
        key="compoundSummary"
        account={account}
        compoundSummary={compoundSummary}
      />,
    );
  }

  if (AccountBalanceSummaryFooter)
    footers.push(
      <AccountBalanceSummaryFooter
        account={account}
        key="accountbalancesummary"
      />,
    );
  if (!footers.length) return null;
  return footers;
};

type Props = {
  account?: AccountLike;
  parentAccount?: Account | undefined | null;
  countervalueAvailable: boolean;
  useCounterValue: boolean;
  range: any;
  history: any;
  countervalueChange: ValueChange;
  cryptoChange: ValueChange;
  counterValueCurrency: Currency;
  onAccountPress: DebouncedFunc<(tokenAccount: TokenAccount) => void>;
  onSwitchAccountCurrency: () => void;
  compoundSummary?: CompoundAccountSummary | null;
  isCollapsed?: boolean;
  setIsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
};

export function getListHeaderComponents({
  account,
  parentAccount,
  countervalueAvailable,
  useCounterValue,
  range,
  history,
  countervalueChange,
  cryptoChange,
  counterValueCurrency,
  onAccountPress,
  onSwitchAccountCurrency,
  compoundSummary,
}: Props): {
  listHeaderComponents: ReactNode[];
  stickyHeaderIndices?: number[];
} {
  if (!account)
    return { listHeaderComponents: [], stickyHeaderIndices: undefined };

  const mainAccount = getMainAccount(account, parentAccount);

  const empty = isAccountEmpty(account);
  const shouldUseCounterValue = countervalueAvailable && useCounterValue;

  const AccountHeader =
    perFamilyAccountHeader[
      mainAccount.currency.family as keyof typeof perFamilyAccountHeader
    ];
  const AccountBodyHeader =
    perFamilyAccountBodyHeader[
      mainAccount.currency.family as keyof typeof perFamilyAccountBodyHeader
    ];

  const AccountSubHeader =
    perFamilyAccountSubHeader[
      mainAccount.currency.family as keyof typeof perFamilyAccountSubHeader
    ];
  const stickyHeaderIndices = empty ? [] : [4];

  return {
    listHeaderComponents: [
      <Header accountId={account.id} />,
      !!AccountSubHeader && <AccountSubHeader />,
      !empty && !!AccountHeader && (
        <AccountHeader
          account={account}
          parentAccount={parentAccount || undefined}
        />
      ),
      !empty && (
        <Box mx={6} my={6}>
          <AccountGraphCard
            account={account}
            range={range}
            history={history}
            useCounterValue={shouldUseCounterValue}
            valueChange={
              shouldUseCounterValue ? countervalueChange : cryptoChange
            }
            countervalueAvailable={countervalueAvailable}
            counterValueCurrency={counterValueCurrency}
            renderAccountSummary={renderAccountSummary(
              account,
              parentAccount,
              compoundSummary,
            )}
            onSwitchAccountCurrency={onSwitchAccountCurrency}
          />
        </Box>
      ),
      ...(!empty
        ? [
            <Box py={3} mb={8}>
              <FabAccountActions
                account={account}
                parentAccount={parentAccount || undefined}
              />
            </Box>,
          ]
        : []),

      ...(!empty && AccountBodyHeader
        ? [
            <AccountBodyHeader
              account={account}
              parentAccount={parentAccount || undefined}
            />,
          ]
        : []),
      ...(!empty && account.type === "Account" && account.subAccounts
        ? [
            <Box mx={6} mb={8} pb={6}>
              <SubAccountsList
                accountId={account.id}
                onAccountPress={onAccountPress}
                parentAccount={account}
                useCounterValue={shouldUseCounterValue}
              />
            </Box>,
          ]
        : []),
      ...(!empty && account.type === "Account" && isNFTActive(account.currency)
        ? [<NftCollectionsList account={account} />]
        : []),
      ...(compoundSummary &&
      account &&
      account.type === "TokenAccount" &&
      parentAccount
        ? [
            <CompoundAccountBodyHeader
              account={account}
              parentAccount={parentAccount}
              compoundSummary={compoundSummary}
            />,
          ]
        : []),
    ],
    stickyHeaderIndices,
  };
}
