import React from "react";
import { useTheme } from "@react-navigation/native";
import { HederaDelegationStatus } from "@ledgerhq/live-common/families/hedera/types";
import CheckCircle from "~/icons/CheckCircle";
import ExclamationCircle from "~/icons/ExclamationCircle";

interface Props {
  status: HederaDelegationStatus;
  size?: number;
}

export default function DelegationStatusIcon({ status, size = 14 }: Props) {
  const { colors } = useTheme();

  if (status === "inactive") {
    return <ExclamationCircle size={size} color={colors.alert} />;
  }

  if (status === "overstaked") {
    return <ExclamationCircle size={size} color={colors.warning} />;
  }

  return <CheckCircle size={size} color={colors.green} />;
}
