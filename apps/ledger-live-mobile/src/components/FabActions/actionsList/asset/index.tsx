import React, { memo, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { QuickActionList } from "@ledgerhq/native-ui";
import { QuickActionButtonProps } from "@ledgerhq/native-ui/components/cta/QuickAction/QuickActionButton";
import { Linking } from "react-native";

import useAssetActions from "../../hooks/useAssetActions";
import { ActionButton } from "../../index";
import { track } from "../../../../analytics";

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
  currency?: CryptoCurrency | TokenCurrency;
  accounts?: AccountLike[];
};

const FabAssetActionsComponent: React.FC<Props> = ({ currency, accounts }) => {
  const navigation = useNavigation();

  const { mainActions } = useAssetActions({ currency, accounts });

  const onNavigate = useCallback(
    (name: string, options?: any) => {
      navigation.navigate(name, {
        ...options,
        params: {
          ...(options ? options.params : {}),
        },
      });
    },
    [navigation],
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

  const quickActions: QuickActionButtonProps[] = mainActions
    .map(action => ({
      Icon: action.Icon,
      children: action.label,
      onPress: () => onPress(action),
      disabled: action.disabled,
    }))
    .sort(a => (a.disabled ? 0 : -1));

  return (
    <>
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

export const FabAssetActions = memo(FabAssetActionsComponent);
