import React, { ReactNode } from "react";
import {
  isAccountEmpty,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  AccountLike,
  Account,
  ValueChange,
  PortfolioRange,
  BalanceHistoryWithCountervalue,
} from "@ledgerhq/types-live";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Box, ColorPalette } from "@ledgerhq/native-ui";
import { isNFTActive } from "@ledgerhq/live-common/nft/index";
import { TFunction } from "react-i18next";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";
import { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import { NearAccount } from "@ledgerhq/live-common/families/near/types";
import { LayoutChangeEvent } from "react-native";
import Header from "./Header";
import AccountGraphCard from "../../components/AccountGraphCard";
import SubAccountsList from "./SubAccountsList";
import NftCollectionsList from "./NftCollectionsList";
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
  range: PortfolioRange;
  history: BalanceHistoryWithCountervalue;
  countervalueChange: ValueChange;
  cryptoChange: ValueChange;
  counterValueCurrency: Currency;
  onAccountPress: () => void;
  onSwitchAccountCurrency: () => void;
  onAccountCardLayout: (event: LayoutChangeEvent) => void;
  colors: ColorPalette;
  secondaryActions: ActionButtonEvent[];
  t: TFunction;
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

  const AccountBalanceSummaryFooter =
    perFamilyAccountBalanceSummaryFooter[
      family as keyof typeof perFamilyAccountBalanceSummaryFooter
    ];
  const AccountBalanceSummaryFooterRendered =
    AccountBalanceSummaryFooter &&
    AccountBalanceSummaryFooter({
      account: account as Account &
        CosmosAccount &
        PolkadotAccount &
        ElrondAccount &
        NearAccount,
    });

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
                  <Box mb={6}>{AccountBalanceSummaryFooterRendered}</Box>
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
    ],
    stickyHeaderIndices,
  };
}
