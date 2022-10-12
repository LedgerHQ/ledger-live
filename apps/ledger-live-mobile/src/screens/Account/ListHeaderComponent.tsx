import React, { ReactNode } from "react";
import {
  isAccountEmpty,
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { AccountLike, Account, ValueChange } from "@ledgerhq/types-live";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { CompoundAccountSummary } from "@ledgerhq/live-common/compound/types";

import { Box, ColorPalette } from "@ledgerhq/native-ui";
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
import SectionTitle from "../WalletCentricSections/SectionTitle";
import SectionContainer from "../WalletCentricSections/SectionContainer";

import {
  FabAccountActions,
  FabAccountMainActions,
} from "../../components/FabActions/actionsList/account";
import { ActionButtonEvent } from "../../components/FabActions";

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
  colors: ColorPalette;
  secondaryActions: ActionButtonEvent[];
  t: any;
};

type MaybeComponent =
  | React.FunctionComponent<
      Partial<{
        account?: AccountLike;
        parentAccount?: Account;
      }>
    >
  | undefined;

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
  colors,
  secondaryActions,
  t,
}: Props): {
  listHeaderComponents: ReactNode[];
  stickyHeaderIndices?: number[];
} {
  if (!account)
    return { listHeaderComponents: [], stickyHeaderIndices: undefined };

  const mainAccount = getMainAccount(account, parentAccount);
  const family: string = mainAccount.currency.family;

  const empty = isAccountEmpty(account);
  const shouldUseCounterValue = countervalueAvailable && useCounterValue;

  const AccountHeader = (
    perFamilyAccountHeader as Record<string, MaybeComponent>
  )[family];
  const AccountHeaderRendered =
    AccountHeader && AccountHeader({ account, parentAccount });

  const AccountBodyHeader = (
    perFamilyAccountBodyHeader as Record<string, MaybeComponent>
  )[family];
  // Pre-render component, cause we need to know if it return null so we don't render an empty border container (Tezos was doing it)
  const AccountBodyHeaderRendered =
    AccountBodyHeader && AccountBodyHeader({ account, parentAccount });

  const AccountSubHeader = (
    perFamilyAccountSubHeader as Record<string, MaybeComponent>
  )[family];

  const AccountBalanceSummaryFooter = (
    perFamilyAccountBalanceSummaryFooter as Record<string, MaybeComponent>
  )[family];
  const AccountBalanceSummaryFooterRendered =
    AccountBalanceSummaryFooter &&
    AccountBalanceSummaryFooter({ account, parentAccount });

  const stickyHeaderIndices = empty ? [] : [0];

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
          counterValueUnit={counterValueCurrency.units[0]}
          cryptoCurrencyUnit={getAccountUnit(account)}
          parentAccount={parentAccount}
        />
      </Box>,
      <Header />,
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
        <FabAccountMainActions
          account={account}
          parentAccount={parentAccount}
        />
      </SectionContainer>,
      ...(!empty &&
      (AccountHeaderRendered ||
        AccountBalanceSummaryFooterRendered ||
        (compoundSummary && account.type === "TokenAccount") ||
        secondaryActions.length > 0)
        ? [
            <SectionContainer>
              <SectionTitle
                title={t("account.earn")}
                containerProps={{ mx: 6, mb: 6 }}
              />
              <Box>
                {AccountHeaderRendered && (
                  <Box mx={6} mb={6}>
                    {AccountHeaderRendered}
                  </Box>
                )}
                {AccountBalanceSummaryFooterRendered && (
                  <>
                    <Box mb={6}>{AccountBalanceSummaryFooterRendered}</Box>
                  </>
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
            <SectionContainer px={6}>
              <CompoundAccountBodyHeader
                account={account}
                parentAccount={parentAccount}
                compoundSummary={compoundSummary}
              />
            </SectionContainer>,
          ]
        : []),
    ],
    stickyHeaderIndices,
  };
}
