import React from "react";
import { useTheme } from "styled-components/native";
import AccounstListView from "LLM/features/Accounts/components/AccountsListView";
import { LNSUpsellBanner } from "LLM/features/LNSUpsell";
import { ScreenName } from "~/const";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import SafeAreaView from "~/components/SafeAreaView";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import AddAccountButton from "LLM/features/Accounts/components/AddAccountButton";
import { useTranslation } from "react-i18next";
import { TrackScreen } from "~/analytics";
import { RefreshMedium } from "@ledgerhq/icons-ui/nativeLegacy";
import Spinning from "~/components/Spinning";
import AccountsEmptyList from "LLM/components/EmptyList/AccountsEmptyList";
import useGenericAccountsListViewModel, {
  GenericAccountsType,
} from "./hooks/useGenericAccountsListViewModel";
import useSpecificAccountsListViewModel, {
  SpecificAccountsType,
} from "./hooks/useSpecificAccountsListViewModel";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { AccountsListNavigator } from "./types";

type ViewProps = GenericAccountsType & Partial<SpecificAccountsType>;

function View({
  hasNoAccount,
  isSyncEnabled,
  canAddAccount,
  showHeader,
  pageTrackingEvent,
  syncPending,
  sourceScreenName,
  specificAccounts,
  isAddAccountCtaDisabled,
  currencyToTrack,
  ticker,
  onClick,
}: ViewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <>
      <TrackScreen name={pageTrackingEvent} source={sourceScreenName} currency={currencyToTrack} />
      <ReactNavigationPerformanceView screenName={ScreenName.AccountsList} interactive>
        <SafeAreaView edges={["left", "right", "bottom"]} isFlex style={{ marginHorizontal: 16 }}>
          {showHeader && (
            <Text variant="h1Inter" fontWeight="semiBold" fontSize={28} paddingY={2}>
              {ticker
                ? t("accounts.cryptoAccountsTitle", { currencyTicker: ticker })
                : t("accounts.title")}
            </Text>
          )}
          {syncPending && (
            <Flex flexDirection="row" alignItems="center" my={3}>
              <Spinning clockwise>
                <RefreshMedium size={20} color="neutral.c80" />
              </Spinning>
              <Text color="neutral.c80" ml={2}>
                {t("portfolio.syncPending")}
              </Text>
            </Flex>
          )}
          {canAddAccount && (
            <AddAccountButton
              disabled={isAddAccountCtaDisabled}
              sourceScreenName={pageTrackingEvent}
              currency={currencyToTrack}
              onClick={onClick}
            />
          )}
          {hasNoAccount ? (
            <AccountsEmptyList sourceScreenName={sourceScreenName} />
          ) : (
            <AccounstListView
              sourceScreenName={sourceScreenName}
              isSyncEnabled={isSyncEnabled}
              specificAccounts={specificAccounts}
            />
          )}
          <Box
            backgroundColor={colors.neutral.c00}
            style={[
              {
                shadowOffset: { width: 0, height: -16 },
                shadowColor: colors.neutral.c00,
                shadowOpacity: 1,
                shadowRadius: 5,
              },
            ]}
          >
            <LNSUpsellBanner location="accounts" mt={2} mb={3} />
          </Box>
        </SafeAreaView>
      </ReactNavigationPerformanceView>
    </>
  );
}

export type Props = BaseComposite<
  StackNavigatorProps<AccountsListNavigator, ScreenName.AccountsList>
>;

const GenericAccountsList = (props: Props) => {
  return <View {...useGenericAccountsListViewModel(props)} />;
};

const SpecificAccountsList = ({
  props,
  specificAccounts,
}: {
  props: Props;
  specificAccounts: Account[] | TokenAccount[];
}) => {
  return <View {...useSpecificAccountsListViewModel({ ...props, specificAccounts })} />;
};

const AccountsList = (props: Props) => {
  const { params } = props.route;
  const hasSpecificAccounts = params?.specificAccounts && params?.specificAccounts.length > 0;
  return hasSpecificAccounts ? (
    <SpecificAccountsList props={props} specificAccounts={params.specificAccounts} />
  ) : (
    <GenericAccountsList {...props} />
  );
};

export default AccountsList;
