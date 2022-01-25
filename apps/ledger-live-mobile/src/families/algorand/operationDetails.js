// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type {
  Account,
  OperationType,
  Operation,
} from "@ledgerhq/live-common/lib/types";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account/helpers";

import * as Animatable from "react-native-animatable";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import Section from "../../screens/OperationDetails/Section";
import OperationStatusIcon from "../../icons/OperationStatusIcon";
import { discreetModeSelector } from "../../reducers/settings";

type Props = {
  extra: {
    rewards?: BigNumber,
    memo?: string,
    assetId?: string,
  },
  account: Account,
};

function OperationDetailsExtra({ extra, account }: Props) {
  const { t } = useTranslation();
  const unit = getAccountUnit(account);
  const discreet = useSelector(discreetModeSelector);
  const formattedRewards =
    extra.rewards && extra.rewards.gt(0)
      ? formatCurrencyUnit(unit, extra.rewards, {
          disableRounding: true,
          alwaysShowSign: false,
          showCode: true,
          discreet,
        })
      : null;

  return (
    <>
      {formattedRewards && (
        <Section
          title={t("operationDetails.extra.rewards")}
          value={formattedRewards}
        />
      )}
      {extra.assetId && (
        <Section
          title={t("operationDetails.extra.assetId")}
          value={extra.assetId}
        />
      )}
      {extra.memo && (
        <Section title={t("operationDetails.extra.memo")} value={extra.memo} />
      )}
    </>
  );
}

type OperationIconProps = {
  type: OperationType,
  size: number,
  confirmed: boolean,
  operation: Operation,
};

const anim = (size, negated) => ({
  from: {
    transform: [{ translateX: 0 }],
  },
  to: {
    transform: [{ translateX: (negated ? -size : size) / 4 }],
  },
});

const OperationIcon = ({
  type,
  size,
  confirmed,
  operation: { hasFailed, extra },
}: OperationIconProps) => {
  const { colors } = useTheme();
  const rewards = extra.rewards && extra.rewards.gt(0) ? extra.rewards : null;
  return rewards ? (
    <View style={styles.operationIconContainer}>
      <Animatable.View
        animation={anim(size, true)}
        duration={1000}
        useNativeDriver
        style={[
          styles.operationMainIcon,
          { width: size - 2, height: size - 2, backgroundColor: colors.card },
        ]}
      >
        <OperationStatusIcon
          confirmed={confirmed}
          type={type}
          failed={hasFailed}
          size={size}
        />
      </Animatable.View>
      <Animatable.View
        animation={anim(size)}
        duration={1000}
        useNativeDriver
        style={styles.operationSecondaryIcon}
      >
        <OperationStatusIcon
          confirmed={confirmed}
          type={"REWARD"}
          failed={hasFailed}
          size={size}
        />
      </Animatable.View>
    </View>
  ) : (
    <OperationStatusIcon
      confirmed={confirmed}
      type={type}
      failed={hasFailed}
      size={size}
    />
  );
};

const styles = StyleSheet.create({
  operationIconContainer: { position: "relative" },
  operationMainIcon: {
    position: "relative",
    zIndex: 1,
    borderRadius: 100,
  },
  operationSecondaryIcon: { position: "absolute", zIndex: 0, right: 0, top: 0 },
});

const operationStatusIcon = {
  OUT: OperationIcon,
  IN: OperationIcon,
};

export default {
  OperationDetailsExtra,
  operationStatusIcon,
};
