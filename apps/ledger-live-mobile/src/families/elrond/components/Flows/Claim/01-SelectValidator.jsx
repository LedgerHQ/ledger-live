// @flow
import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";

import SafeAreaView from "react-native-safe-area-view";
import BigNumber from "bignumber.js";

import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";

import { accountScreenSelector } from "../../../../../reducers/accounts";
import { ScreenName } from "../../../../../const";

import LText from "../../../../../components/LText";
import FirstLetterIcon from "../../../../../components/FirstLetterIcon";
import CurrencyUnitValue from "../../../../../components/CurrencyUnitValue";
import ArrowRight from "../../../../../icons/ArrowRight";

interface RouteParams {
  accountId: string;
  transaction: any;
}

interface Props {
  navigation: any;
  route: { params: RouteParams };
}

const styles = StyleSheet.create({
  stack: {
    root: {
      flex: 1,
    },
    main: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    list: {
      width: "100%",
    },
  },
  item: {
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    },
    iconWrapper: {
      height: 36,
      width: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 5,

      marginRight: 12,
    },
    nameWrapper: {
      flex: 1,
      paddingRight: 16,
    },
    nameText: {
      fontSize: 15,
    },
    subText: {
      fontSize: 13,
    },
    valueContainer: {
      alignItems: "flex-end",
    },
    value: {
      flexDirection: "row",
      alignItems: "center",
    },
    valueLabel: {
      paddingHorizontal: 8,
      fontSize: 16,
    },
  },
});

const Validator = (props: Props) => {
  const { navigation, route } = props;
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  const delegations = useMemo(
    () =>
      route.params.delegations.filter(delegation =>
        BigNumber(delegation.claimableRewards).gt(0),
      ),
    [route.params.delegations],
  );

  const mainAccount = getMainAccount(account);
  const bridge = getAccountBridge(account);
  const unit = getAccountUnit(account);

  const { transaction } = useBridgeTransaction(() => ({
    account,
    transaction: bridge.updateTransaction(
      bridge.createTransaction(mainAccount),
      {
        mode: "claimRewards",
        recipient: mainAccount.freshAddress,
      },
    ),
  }));

  const onSelect = useCallback(
    (recipient, validator, value) => {
      navigation.navigate(ScreenName.ElrondClaimRewardsMethod, {
        ...route.params,
        transaction: bridge.updateTransaction(transaction, {
          recipient,
          amount: BigNumber(value),
        }),
        contract: recipient,
        validator,
        value,
        account,
      });
    },
    [navigation, route.params, transaction, bridge, account],
  );

  const renderItem = useCallback(
    props => <Item {...{ ...props, unit, onSelect }} />,
    [unit, onSelect],
  );

  return (
    <SafeAreaView
      style={[styles.stack.root, { backgroundColor: colors.background }]}
    >
      <View style={styles.stack.main}>
        <FlatList
          style={styles.stack.list}
          keyExtractor={delegation =>
            `${delegation.address}-${delegation.userActiveStake}-${delegation.claimableRewards}`
          }
          data={delegations}
          {...{ renderItem }}
        />
      </View>
    </SafeAreaView>
  );
};

const Item = (props: any) => {
  const { colors } = useTheme();
  const { item, unit, onSelect, index } = props;
  const { validator, contract, claimableRewards } = item;

  return (
    <TouchableOpacity
      onPress={() => onSelect(contract, validator, claimableRewards)}
      style={[styles.item.wrapper]}
    >
      <View
        style={[styles.item.iconWrapper, { backgroundColor: colors.lightLive }]}
      >
        <FirstLetterIcon
          style={{ backgroundColor: colors.lightFog }}
          label={validator.name || contract}
        />
      </View>

      <View style={styles.item.nameWrapper}>
        <LText semiBold={true} style={[styles.item.nameText]} numberOfLines={1}>
          {index}. {validator.name || contract}
        </LText>

        {validator.apr && (
          <LText style={styles.item.subText} color="grey" numberOfLines={1}>
            <Trans
              i18nKey="cosmos.delegation.flow.steps.validator.estYield"
              values={{
                amount: validator.apr,
              }}
            />
          </LText>
        )}
      </View>

      <View style={styles.item.value}>
        <View style={styles.item.valueContainer}>
          <LText
            semiBold={true}
            style={[styles.item.valueLabel]}
            color="darkBlue"
          >
            <CurrencyUnitValue
              value={claimableRewards}
              unit={unit}
              showCode={false}
            />
          </LText>
        </View>

        <ArrowRight size={16} color={colors.grey} />
      </View>
    </TouchableOpacity>
  );
};

export default Validator;
