import React, { ReactNode } from "react";
import { LayoutChangeEvent } from "react-native";
import { isAccountEmpty, getMainAccount } from "@ledgerhq/live-common/account/index";
import {
  AccountLike,
  Account,
  ValueChange,
  PortfolioRange,
  BalanceHistoryWithCountervalue,
} from "@ledgerhq/types-live";
import { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { Box, ColorPalette } from "@ledgerhq/native-ui";
import { TFunction } from "react-i18next";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";
import { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import { NearAccount } from "@ledgerhq/live-common/families/near/types";
import { isEditableOperation, isStuckOperation } from "@ledgerhq/live-common/operation";
import AccountGraphCard from "~/components/AccountGraphCard";
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
} from "~/components/FabActions/actionsList/account";
import { ActionButtonEvent } from "~/components/FabActions";
import { EditOperationCard } from "~/components/EditOperationCard";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import WarningBannerStatus from "~/components/WarningBannerStatus";
import ErrorWarning from "./ErrorWarning";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { isNFTCollectionsDisplayable } from "./nftHelper";

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
  currency: CryptoCurrency;
  currencyConfig?: (CurrencyConfig & Record<string, unknown>) | undefined;
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

export function useListHeaderComponents({
  account,
  parentAccount,
  currency,
  currencyConfig,
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
  const llmSolanaNfts = useFeature("llmSolanaNfts");
  if (!account) return { listHeaderComponents: [], stickyHeaderIndices: undefined };

  const mainAccount = getMainAccount(account, parentAccount);
  const family: string = mainAccount.currency.family;

  const empty = isAccountEmpty(account);
  const shouldUseCounterValue = countervalueAvailable && useCounterValue;

  const AccountHeader = (perFamilyAccountHeader as Record<string, MaybeComponent>)[family];
  const AccountHeaderRendered = AccountHeader && AccountHeader({ account, parentAccount });

  const AccountBodyHeader = (perFamilyAccountBodyHeader as Record<string, MaybeComponent>)[family];
  debugger;
  // Pre-render component, cause we need to know if it return null so we don't render an empty border container (Tezos was doing it)
  const AccountBodyHeaderRendered =
    AccountBodyHeader && AccountBodyHeader({ account, parentAccount });

  const AccountSubHeader = (perFamilyAccountSubHeader as Record<string, MaybeComponent>)[family];

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
        MultiversXAccount &
        NearAccount,
    });

  const stickyHeaderIndices = empty ? [] : [0];

  const [oldestEditableOperation] = account.pendingOperations
    .filter(pendingOperation => {
      return isEditableOperation({ account: mainAccount, operation: pendingOperation });
    })
    .sort((a, b) => a.transactionSequenceNumber! - b.transactionSequenceNumber!);

  const isOperationStuck =
    oldestEditableOperation &&
    isStuckOperation({ family: mainAccount.currency.family, operation: oldestEditableOperation });

  const displayNftCollections = isNFTCollectionsDisplayable(account, empty, {
    llmSolanaNftsEnabled: llmSolanaNfts?.enabled,
  });

  return {
    listHeaderComponents: [
      <Box mt={6} onLayout={onAccountCardLayout} key="AccountGraphCard">
        <AccountGraphCard
          account={account}
          range={range}
          history={history}
          useCounterValue={shouldUseCounterValue}
          valueChange={shouldUseCounterValue ? countervalueChange : cryptoChange}
          countervalueAvailable={countervalueAvailable}
          counterValueCurrency={counterValueCurrency}
          onSwitchAccountCurrency={onSwitchAccountCurrency}
          parentAccount={parentAccount}
        />
      </Box>,
      <WarningBannerStatus
        currencyConfig={currencyConfig}
        currency={currency}
        key="WarningBannerStatus"
      />,
      <ErrorWarning key="Header" />,
      !!AccountSubHeader && (
        <Box bg={colors.background.main} key="AccountSubHeader">
          <AccountSubHeader account={account} parentAccount={parentAccount} />
        </Box>
      ),
      oldestEditableOperation ? (
        <EditOperationCard
          oldestEditableOperation={oldestEditableOperation}
          isOperationStuck={isOperationStuck}
          account={account}
          parentAccount={parentAccount}
          key="EditOperationCard"
        />
      ) : null,
      <SectionContainer px={6} bg={colors.background.main} key="FabAccountMainActions">
        <SectionTitle title={t("account.quickActions")} containerProps={{ mb: 6 }} />
        <FabAccountMainActions account={account} parentAccount={parentAccount} />
      </SectionContainer>,
      ...(!empty &&
      (AccountHeaderRendered || AccountBalanceSummaryFooterRendered || secondaryActions.length > 0)
        ? [
            <SectionContainer key="AccountHeader">
              <SectionTitle title={t("account.earn")} containerProps={{ mx: 6, mb: 6 }} />
              <Box>
                {AccountHeaderRendered && (
                  <Box mx={6} mb={6}>
                    {AccountHeaderRendered}
                  </Box>
                )}
                {AccountBalanceSummaryFooterRendered && (
                  <Box mb={6}>{AccountBalanceSummaryFooterRendered}</Box>
                )}
                <FabAccountActions account={account} parentAccount={parentAccount} />
              </Box>
            </SectionContainer>,
          ]
        : []),
      ...(!empty && AccountBodyHeaderRendered
        ? [<SectionContainer key="AccountBody">{AccountBodyHeaderRendered}</SectionContainer>]
        : []),
      ...(!empty && account.type === "Account" && account.subAccounts
        ? [
            <SectionContainer px={6} key="SubAccountsList">
              <SubAccountsList
                accountId={account.id}
                onAccountPress={onAccountPress}
                parentAccount={account}
                useCounterValue={shouldUseCounterValue}
              />
            </SectionContainer>,
          ]
        : []),
      ...(displayNftCollections && account.type === "Account"
        ? [
            <SectionContainer px={6} key="NftCollectionsList">
              <NftCollectionsList account={account} />
            </SectionContainer>,
          ]
        : []),
    ],
    stickyHeaderIndices,
  };
}
