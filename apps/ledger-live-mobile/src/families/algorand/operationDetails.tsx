import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { useSelector } from "react-redux";
import { IconsLegacy } from "@ledgerhq/native-ui";
import Section from "~/screens/OperationDetails/Section";
import OperationStatusIcon from "~/icons/OperationStatusIcon";
import { discreetModeSelector } from "~/reducers/settings";
import {
  AlgorandOperation,
  AlgorandAccount,
  AlgorandOperationExtra,
} from "@ledgerhq/live-common/families/algorand/types";
import { useSettings } from "~/hooks";

type Props = {
  operation: AlgorandOperation;
  account: AlgorandAccount;
};

function OperationDetailsExtra({ operation, account }: Props) {
  const { t } = useTranslation();
  const unit = getAccountUnit(account);
  const discreet = useSelector(discreetModeSelector);
  const { locale } = useSettings();
  const formattedRewards = operation.extra.rewards?.gt(0)
    ? formatCurrencyUnit(unit, operation.extra.rewards, {
        locale: locale,
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
        discreet,
      })
    : null;
  return (
    <>
      {formattedRewards && (
        <Section title={t("operationDetails.extra.rewards")} value={formattedRewards} />
      )}
      {operation.extra.assetId && (
        <Section title={t("operationDetails.extra.assetId")} value={operation.extra.assetId} />
      )}
      {operation.extra.memo && (
        <Section title={t("operationDetails.extra.memo")} value={operation.extra.memo} />
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
  const e = extra as AlgorandOperationExtra;
  const rewards = e?.rewards?.gt(0) ? e.rewards : null;
  return rewards ? (
    <View style={styles.operationIconContainer}>
      <OperationStatusIcon
        confirmed={confirmed}
        type={type}
        Badge={IconsLegacy.ClaimRewardsMedium}
        failed={hasFailed}
        size={size}
      />
    </View>
  ) : (
    <OperationStatusIcon confirmed={confirmed} type={type} failed={hasFailed} size={size} />
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
