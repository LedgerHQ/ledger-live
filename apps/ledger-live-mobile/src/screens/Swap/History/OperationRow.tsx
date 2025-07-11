import React, { useCallback } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Icon } from "@ledgerhq/native-ui";
import type { MappedSwapOperation } from "@ledgerhq/live-common/exchange/swap/types";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { SwapStatusIndicator } from "../SwapStatusIndicator";
import { ScreenName } from "~/const";
import type { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { useAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "~/hooks/useAccountUnit";

const OperationRow = ({ item }: { item: MappedSwapOperation }) => {
  const { colors } = useTheme();
  const { fromAccount, toAccount, ...routeParams } = item;
  const { swapId, fromAmount, toAmount, status } = routeParams;
  const navigation = useNavigation<StackNavigatorNavigation<SwapNavigatorParamList>>();

  const onOpenOperationDetails = useCallback(() => {
    navigation.navigate(ScreenName.SwapOperationDetails, {
      swapOperation: {
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        ...routeParams,
      },
    });
  }, [navigation, routeParams, fromAccount, toAccount]);

  const fromAccountName = useAccountName(fromAccount);
  const toAccountName = useAccountName(toAccount);

  const unitFrom = useAccountUnit(fromAccount);
  const unitTo = useAccountUnit(toAccount);

  return (
    <TouchableOpacity
      key={swapId}
      onPress={onOpenOperationDetails}
      testID={`swap-operation-row-${swapId}`}
    >
      <View
        style={[styles.root, { backgroundColor: colors.card, borderBottomColor: colors.lightFog }]}
      >
        <SwapStatusIndicator small status={status} />
        <View style={[styles.accountWrapper, { marginLeft: 18 }]}>
          <LText
            numberOfLines={1}
            semiBold
            style={styles.name}
            testID={`swap-history-fromAccount-${swapId}`}
          >
            {fromAccountName}
          </LText>
          <LText style={styles.amount} testID={`swap-history-fromAmount-${swapId}`}>
            <CurrencyUnitValue showCode unit={unitFrom} value={fromAmount} />
          </LText>
        </View>
        <View style={styles.arrow}>
          <Icon name="ArrowRightLight" size={30} color="neutral.c70" />
        </View>
        <View style={[styles.accountWrapper, { alignItems: "flex-end" }]}>
          <LText
            numberOfLines={1}
            semiBold
            style={styles.name}
            testID={`swap-history-toAccount-${swapId}`}
          >
            {toAccountName}
          </LText>
          <LText style={styles.amount} color="grey" testID={`swap-history-toAmount-${swapId}`}>
            <CurrencyUnitValue showCode unit={unitTo} value={toAmount} />
          </LText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  arrow: {
    flex: 1,
    alignItems: "center",
  },
  name: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 2,
  },
  amount: {
    fontSize: 13,
    lineHeight: 15,
  },
  accountWrapper: {
    width: "35%",
  },
});

export default OperationRow;
