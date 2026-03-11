import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/core";
import React, { memo, useCallback } from "react";
import EditOperationPanelView from "~/components/EditTransaction/EditOperationPanel";
import { NavigatorName, ScreenName } from "~/const";
import { useEditTxFeatureFlag } from "~/hooks/useEditTxFeatureFlag";

type EditOperationPanelProps = {
  isOperationStuck: boolean;
  operation: Operation;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  onPress?: () => void;
};

const EditOperationPanelComponent = ({
  isOperationStuck,
  operation,
  account,
  parentAccount,
  onPress,
}: EditOperationPanelProps) => {
  const navigation = useNavigation();
  const { isEditTxEnabled, isCurrencySupported } = useEditTxFeatureFlag({
    featureKey: "editBitcoinTx",
    account,
    parentAccount,
  });

  const onLinkPress = useCallback(() => {
    onPress?.();

    if (account && isCurrencySupported) {
      navigation.navigate(NavigatorName.BitcoinEditTransaction, {
        screen: ScreenName.BitcoinEditTransactionMethodSelection,
        params: { operation, account, parentAccount },
      });
    }
  }, [account, parentAccount, operation, navigation, onPress, isCurrencySupported]);

  if (!isEditTxEnabled || !isCurrencySupported) {
    return null;
  }

  return <EditOperationPanelView isOperationStuck={isOperationStuck} onPressCta={onLinkPress} />;
};

export const EditOperationPanel = memo<EditOperationPanelProps>(EditOperationPanelComponent);
