import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { Account, OperationType, Operation } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { useSelector } from "react-redux";
import { Icons } from "@ledgerhq/native-ui";
import Section from "../../screens/OperationDetails/Section";
import OperationStatusIcon from "../../icons/OperationStatusIcon";
import { discreetModeSelector, localeSelector } from "../../reducers/settings";

type Props = {
  extra: {
    rewards?: BigNumber;
    memo?: string;
    assetId?: string;
  };
  account: Account;
};

function OperationDetailsExtra({ extra, account }: Props) {
  const { t } = useTranslation();
  const unit = getAccountUnit(account);
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const formattedRewards =
    extra.rewards && extra.rewards.gt(0)
      ? formatCurrencyUnit(unit, extra.rewards, {
          locale,
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
  type: OperationType;
  size: number;
  confirmed: boolean;
  operation: Operation;
};

const OperationIcon = ({
  type,
  size,
  confirmed,
  operation: { hasFailed, extra },
}: OperationIconProps) => {
  const rewards = extra.rewards && extra.rewards.gt(0) ? extra.rewards : null;
  return rewards ? (
    <View style={styles.operationIconContainer}>
      <OperationStatusIcon
        confirmed={confirmed}
        type={type}
        Badge={Icons.ClaimRewardsMedium}
        failed={hasFailed}
        size={size}
      />
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
  operationIconContainer: {
    position: "relative",
  },
  operationMainIcon: {
    position: "relative",
    zIndex: 1,
    borderRadius: 100,
  },
  operationSecondaryIcon: {
    position: "absolute",
    zIndex: 0,
    right: 0,
    top: 0,
  },
});
const operationStatusIcon = {
  OUT: OperationIcon,
  IN: OperationIcon,
};
export default {
  OperationDetailsExtra,
  operationStatusIcon,
};
