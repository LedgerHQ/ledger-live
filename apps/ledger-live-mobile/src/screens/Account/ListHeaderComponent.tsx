import React, { ReactNode } from "react";
import {
  isAccountEmpty,
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { AccountLike, Account, ValueChange } from "@ledgerhq/types-live";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { CompoundAccountSummary } from "@ledgerhq/live-common/compound/types";

import { Box, Flex } from "@ledgerhq/native-ui";
import { isNFTActive } from "@ledgerhq/live-common/nft/index";

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
import styled from "@ledgerhq/native-ui/components/styled";
import { useTranslation } from "react-i18next";

const SectionContainer = styled(Flex).attrs((p: { isLast: boolean }) => ({
  py: 8,
  borderBottomWidth: !p.isLast ? 1 : 0,
  borderBottomColor: "neutral.c30",
}))``;

const renderAccountSummary = (
  account: AccountLike,
  parentAccount: Account,
  compoundSummary: CompoundAccountSummary,
) => () => {
  const mainAccount = getMainAccount(account, parentAccount);
  const AccountBalanceSummaryFooter =
    perFamilyAccountBalanceSummaryFooter[mainAccount.currency.family];

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
  const { t } = useTranslation();

  if (!account)
    return { listHeaderComponents: [], stickyHeaderIndices: undefined };

  const mainAccount = getMainAccount(account, parentAccount);

  const empty = isAccountEmpty(account);
  const shouldUseCounterValue = countervalueAvailable && useCounterValue;

  const AccountHeader = perFamilyAccountHeader[mainAccount.currency.family];
  const AccountBodyHeader =
    perFamilyAccountBodyHeader[mainAccount.currency.family];

  const AccountSubHeader =
    perFamilyAccountSubHeader[mainAccount.currency.family];

  const AccountBalanceSummaryFooter =
    perFamilyAccountBalanceSummaryFooter[mainAccount.currency.family];

  const stickyHeaderIndices = empty ? [] : [0];

  return {
    listHeaderComponents: [
      <Header accountId={account.id} />,
      !!AccountSubHeader && <AccountSubHeader />,
      !empty && !!AccountHeader && (
        <AccountHeader account={account} parentAccount={parentAccount} />
      ),
      !empty && (
        <Box mx={6} mt={6}>
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
          />
        </Box>
      ),
      !empty && (
        <SectionContainer px={6}>
          <SectionTitle
            title={t("account.quickActions")}
            containerProps={{ mb: 6 }}
          ></SectionTitle>
          <FabAccountMainActionsComponent
            account={account}
            parentAccount={parentAccount}
          />
        </SectionContainer>
      ),
      ...(!empty
        ? [
            <SectionContainer>
              <Box>
                <SectionTitle
                  title={t("account.earn")}
                  containerProps={{ mx: 6, mb: 6 }}
                ></SectionTitle>
                {AccountBalanceSummaryFooter && (
                  <Box mb={6}>
                    <AccountBalanceSummaryFooter
                      account={account}
                    ></AccountBalanceSummaryFooter>
                  </Box>
                )}
                {compoundSummary && account.type === "TokenAccount" && (
                  <Box>
                    <CompoundSummary
                      key="compoundSummary"
                      account={account}
                      compoundSummary={compoundSummary}
                    ></CompoundSummary>
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
      ...(!empty && AccountBodyHeader
        ? [
            <SectionContainer>
              <AccountBodyHeader
                account={account}
                parentAccount={parentAccount}
              />
            </SectionContainer>,
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
