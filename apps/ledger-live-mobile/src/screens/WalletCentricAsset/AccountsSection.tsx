import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AccountsList from "LLM/features/Accounts/components/AccountsListView";
import AddAccountButton from "LLM/features/Accounts/components/AddAccountButton";

const NB_MAX_ACCOUNTS_TO_DISPLAY = 3;

type Navigation = BaseComposite<StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Asset>>;

type ListProps = {
  accounts: Account[] | TokenAccount[];
  currencyId: string;
  isAddAccountCtaDisabled?: boolean;
  onAddAccount: () => void;
};

const AccountsSection = ({
  accounts,
  currencyId,
  isAddAccountCtaDisabled,
  onAddAccount,
}: ListProps) => {
  const navigation = useNavigation<Navigation["navigation"]>();
  const { t } = useTranslation();

  const accountsToDisplay = useMemo(
    () => accounts.slice(0, NB_MAX_ACCOUNTS_TO_DISPLAY),
    [accounts],
  );

  const goToAccountsScreen = useCallback(() => {
    track("button_clicked", {
      button: "See All",
    });
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.AccountsList,
      params: {
        sourceScreenName: ScreenName.Asset,
        showHeader: true,
        canAddAccount: true,
        isSyncEnabled: true,
        specificAccounts: accounts,
      },
    });
  }, [navigation, accounts]);

  return (
    <>
      <AccountsList
        limitNumberOfAccounts={NB_MAX_ACCOUNTS_TO_DISPLAY}
        specificAccounts={accountsToDisplay}
      />
      <AddAccountButton
        sourceScreenName={ScreenName.Asset}
        disabled={isAddAccountCtaDisabled}
        onClick={onAddAccount}
        currency={currencyId}
      />
      {accounts.length > NB_MAX_ACCOUNTS_TO_DISPLAY ? (
        <Button type="shade" size="large" outline mt={4} onPress={goToAccountsScreen}>
          {t("addAccounts.seeAllAccounts")}
        </Button>
      ) : null}
    </>
  );
};

export default withDiscreetMode(AccountsSection);
