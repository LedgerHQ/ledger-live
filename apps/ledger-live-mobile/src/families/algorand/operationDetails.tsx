import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { IconsLegacy } from "@ledgerhq/native-ui";
import Section from "~/screens/OperationDetails/Section";
import OperationStatusIcon from "~/icons/OperationStatusIcon";
import {
  AlgorandOperation,
  AlgorandAccount,
  AlgorandOperationExtra,
} from "@ledgerhq/live-common/families/algorand/types";
import useFormat from "~/hooks/useFormat";

type Props = {
  operation: AlgorandOperation;
  account: AlgorandAccount;
};

function OperationDetailsExtra({ operation, account }: Props) {
  const { t } = useTranslation();
  const unit = getAccountUnit(account);
  const { formatCurrency } = useFormat();
  const formattedRewards = operation.extra.rewards?.gt(0)
    ? formatCurrency(unit, operation.extra.rewards)
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
