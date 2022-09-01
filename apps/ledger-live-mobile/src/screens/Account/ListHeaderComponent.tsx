import React, { ReactNode } from "react";
import {
  isAccountEmpty,
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { AccountLike, Account, ValueChange } from "@ledgerhq/types-live";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { CompoundAccountSummary } from "@ledgerhq/live-common/compound/types";

import { Box } from "@ledgerhq/native-ui";
import { isNFTActive } from "@ledgerhq/live-common/nft/index";

import { useTheme } from "styled-components/native";
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
import {
  FabAccountActions,
  FabAccountMainActionsComponent,
} from "../../components/FabActions";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import useAccountActions from "./hooks/useAccountActions";

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
  countervalueAvailable: boolean;
  useCounterValue: boolean;
  range: any;
  history: any;
  countervalueChange: ValueChange;
  cryptoChange: ValueChange;
  counterValueCurrency: Currency;
  onAccountPress: () => void;
  onSwitchAccountCurrency: () => void;
  compoundSummary?: CompoundAccountSummary;
  onAccountCardLayout: any;
  t: any;
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
  onAccountCardLayout,
  t,
}: Props): {
  listHeaderComponents: ReactNode[];
  stickyHeaderIndices?: number[];
} {
  if (!account)
    return { listHeaderComponents: [], stickyHeaderIndices: undefined };

  const mainAccount = getMainAccount(account, parentAccount);

  const empty = isAccountEmpty(account);
  const shouldUseCounterValue = countervalueAvailable && useCounterValue;

  const AccountHeader = perFamilyAccountHeader[mainAccount.currency.family];

  const AccountBodyHeader =
    perFamilyAccountBodyHeader[mainAccount.currency.family];
  // Pre-render component, cause we need to know if it return null so we don't render an empty border container (Tezos was doing it)
  const AccountBodyHeaderRendered =
    AccountBodyHeader && AccountBodyHeader({ account, parentAccount });

  const AccountSubHeader =
    perFamilyAccountSubHeader[mainAccount.currency.family];

  const AccountBalanceSummaryFooter =
    perFamilyAccountBalanceSummaryFooter[mainAccount.currency.family];

  const stickyHeaderIndices = empty ? [] : [0];
  const { colors } = useTheme();

  return {
    listHeaderComponents: [
      <Box mt={6} onLayout={onAccountCardLayout}>
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
          onSwitchAccountCurrency={onSwitchAccountCurrency}
          countervalueChange={countervalueChange}
          counterValueUnit={counterValueCurrency.units[0]}
          cryptoCurrencyUnit={getAccountUnit(account)}
          parentAccount={parentAccount}
        />
      </Box>,
      <Header accountId={account.id} />,
      !!AccountSubHeader && (
        <Box bg={colors.background.main}>
          <AccountSubHeader />
        </Box>
      ),
      <SectionContainer px={6} bg={colors.background.main}>
        <SectionTitle
          title={t("account.quickActions")}
          containerProps={{ mb: 6 }}
        />
        <FabAccountMainActionsComponent
          account={account}
          parentAccount={parentAccount}
        />
      </SectionContainer>,
      ...(!empty &&
      (AccountBalanceSummaryFooter ||
        (compoundSummary && account.type === "TokenAccount") ||
        useAccountActions({ account, parentAccount }).secondaryActions.length)
        ? [
            <SectionContainer>
              <Box>
                <SectionTitle
                  title={t("account.earn")}
                  containerProps={{ mx: 6, mb: 6 }}
                />
                {AccountHeader && (
                  <Box mx={6} mb={6}>
                    <AccountHeader
                      account={account}
                      parentAccount={parentAccount}
                    />
                  </Box>
                )}
                {AccountBalanceSummaryFooter && (
                  <Box mb={6}>
                    <AccountBalanceSummaryFooter account={account} />
                  </Box>
                )}
                {compoundSummary && account.type === "TokenAccount" && (
                  <Box>
                    <CompoundSummary
                      key="compoundSummary"
                      account={account}
                      compoundSummary={compoundSummary}
                    />
                  </Box>
                )}
                <FabAccountActions
                  account={account}
                  parentAccount={parentAccount}
                />
              </Box>
            </SectionContainer>,
          ]
        : []),
      ...(!empty && AccountBodyHeaderRendered
        ? [<SectionContainer>{AccountBodyHeaderRendered}</SectionContainer>]
        : []),
      ...(!empty && account.type === "Account" && account.subAccounts
        ? [
            <SectionContainer px={6}>
              <SubAccountsList
                accountId={account.id}
                onAccountPress={onAccountPress}
                parentAccount={account}
                useCounterValue={shouldUseCounterValue}
              />
            </SectionContainer>,
          ]
        : []),
      ...(!empty && account.type === "Account" && isNFTActive(account.currency)
        ? [
            <SectionContainer px={6}>
              <NftCollectionsList account={account} />
            </SectionContainer>,
          ]
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
