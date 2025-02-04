import React, { useCallback, useMemo } from "react";
import { FlatList, ListRenderItem } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import AccountRow from "../Accounts/AccountRow";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AccountsList from "LLM/features/Accounts/components/AccountsListView";
import { FeatureToggle, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import AddAccountButton from "LLM/features/Accounts/components/AddAccountButton";

const NB_MAX_ACCOUNTS_TO_DISPLAY = 3;

type Navigation = BaseComposite<StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Asset>>;

type ListProps = {
  accounts: Account[] | TokenAccount[];
  currencyId: string;
  currencyTicker: string;
  isAddAccountCtaDisabled?: boolean;
  onAddAccount: () => void;
};

const AccountsSection = ({
  accounts,
  currencyId,
  currencyTicker,
  isAddAccountCtaDisabled,
  onAddAccount,
}: ListProps) => {
  const navigation = useNavigation<Navigation["navigation"]>();
  const { t } = useTranslation();
  const llmAccountListUI = useFeature("llmAccountListUI");

  const accountsToDisplay = useMemo(
    () => accounts.slice(0, NB_MAX_ACCOUNTS_TO_DISPLAY),
    [accounts],
  );

  const renderItem: ListRenderItem<Account | TokenAccount> = useCallback(
    ({ item, index }) => (
      <AccountRow
        account={item}
        accountId={item.id}
        isLast={index === accountsToDisplay.length - 1}
        sourceScreenName={ScreenName.Asset}
      />
    ),
    [accountsToDisplay.length],
  );

  const goToAccountsScreen = useCallback(() => {
    track("button_clicked", {
      button: "See All",
    });
    if (llmAccountListUI?.enabled) {
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.AccountsList,
        params: {
          sourceScreenName: ScreenName.Asset,
          showHeader: true,
          canAddAccount: true,
          isSyncEnabled: true,
          specificAccounts: accounts as Account[],
        },
      });
    } else {
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Accounts,
        params: {
          currencyId,
          currencyTicker,
        },
      });
    }
  }, [llmAccountListUI, navigation, accounts, currencyId, currencyTicker]);

  return (
    <>
      <FeatureToggle
        featureId="llmAccountListUI"
        fallback={
          <FlatList<Account | TokenAccount>
            data={accountsToDisplay}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ flex: 1 }}
          />
        }
      >
        <AccountsList
          limitNumberOfAccounts={NB_MAX_ACCOUNTS_TO_DISPLAY}
          specificAccounts={accountsToDisplay}
        />
        <AddAccountButton
          sourceScreenName={ScreenName.Asset}
          disabled={isAddAccountCtaDisabled}
          onClick={onAddAccount}
        />
      </FeatureToggle>
      {accounts.length > NB_MAX_ACCOUNTS_TO_DISPLAY ? (
        <Button type="shade" size="large" outline mt={4} onPress={goToAccountsScreen}>
          {t("addAccounts.seeAllAccounts")}
        </Button>
      ) : null}
    </>
  );
};

export default withDiscreetMode(AccountsSection);
