import React, { memo, useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { QuickActionList } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { QuickActionButtonProps } from "@ledgerhq/native-ui/components/cta/QuickAction/QuickActionButton";
import { Linking } from "react-native";

import { ActionButton } from "../../index";
import useAccountActions from "../../../../screens/Account/hooks/useAccountActions";
import { track } from "../../../../analytics";
import FabAccountButtonBar from "./FabAccountButtonBar";

type FabAccountActionsProps = {
  account: AccountLike;
  parentAccount?: Account;
};

export const FabAccountMainActionsComponent: React.FC<
  FabAccountActionsProps
> = ({ account, parentAccount }: FabAccountActionsProps) => {
  const [pressedDisabledAction, setPressedDisabledAction] = useState<
    ActionButton | undefined
  >(undefined);
  const [isDisabledActionModalOpened, setIsDisabledActionModalOpened] =
    useState(false);

  const { colors } = useTheme();
  const navigation = useNavigation();

  const { mainActions } = useAccountActions({ account, parentAccount, colors });

  const onNavigate = useCallback(
    (name: string, options?: any) => {
      const accountId = account ? account.id : undefined;
      const parentId = parentAccount ? parentAccount.id : undefined;
      navigation.navigate(name, {
        ...options,
        params: {
          ...(options ? options.params : {}),
          accountId,
          parentId,
        },
      });
    },
    [account, parentAccount, navigation],
  );

  const onPress = useCallback(
    (data: ActionButton) => {
      track("button_clicked", {
        button: data.label,
      });
      const { navigationParams, linkUrl } = data;
      if (linkUrl) {
        Linking.openURL(linkUrl);
      } else if (navigationParams) {
        onNavigate(...navigationParams);
      }
    },
    [onNavigate],
  );

  const onPressWhenDisabled = useCallback((action: ActionButton) => {
    setPressedDisabledAction(action);
    setIsDisabledActionModalOpened(true);
  }, []);

  const quickActions: QuickActionButtonProps[] = mainActions
    .map(action => ({
      Icon: action.Icon,
      children: action.label,
      onPress: () => onPress(action),
      disabled: action.disabled,
      onPressWhenDisabled: action.modalOnDisabledClick
        ? () => onPressWhenDisabled(action)
        : undefined,
    }))
    .sort(a => (a.disabled ? 0 : -1));

  return (
    <>
      {pressedDisabledAction?.modalOnDisabledClick?.component && (
        <pressedDisabledAction.modalOnDisabledClick.component
          account={account}
          parentAccount={parentAccount}
          action={pressedDisabledAction}
          isOpen={isDisabledActionModalOpened}
          onClose={() => setIsDisabledActionModalOpened(false)}
        />
      )}
      {/* // Use two columns only when we have only two or four items, otherwise three columns */}
      {quickActions.length === 2 || quickActions.length === 4 ? (
        <QuickActionList
          data={quickActions}
          numColumns={2}
          key={"two_columns"}
          keyExtractor={item => "two_columns_" + item.id}
        />
      ) : (
        <QuickActionList
          data={quickActions}
          numColumns={3}
          key={"three_columns"}
          keyExtractor={item => "three_columns_" + item.id}
        />
      )}
    </>
  );
};

export const FabAccountActionsComponent: React.FC<FabAccountActionsProps> = ({
  account,
  parentAccount,
}: FabAccountActionsProps) => {
  const { colors } = useTheme();
  const { secondaryActions } = useAccountActions({
    account,
    parentAccount,
    colors,
  });

  return (
    <FabAccountButtonBar
      buttons={secondaryActions}
      account={account}
      parentAccount={parentAccount}
    />
  );
};

export const FabAccountActions = memo(FabAccountActionsComponent);
export const FabAccountMainActions = memo(FabAccountMainActionsComponent);
