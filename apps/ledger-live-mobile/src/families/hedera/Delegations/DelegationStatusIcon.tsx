import React from "react";
import { useTheme } from "@react-navigation/native";
import { HederaDelegationStatus } from "@ledgerhq/live-common/families/hedera/types";
import CheckCircle from "~/icons/CheckCircle";
import ExclamationCircle from "~/icons/ExclamationCircle";

interface Props {
  status: HederaDelegationStatus;
}

export default function DelegationStatusIcon({ status }: Props) {
  const { colors } = useTheme();

  if (status === "inactive") {
    return <ExclamationCircle size={14} color={colors.alert} />;
  }

  if (status === "overstaked") {
    return <ExclamationCircle size={14} color={colors.warning} />;
  }

  return <CheckCircle size={14} color={colors.green} />;
}
