import React from "react";
import { useTheme } from "@react-navigation/native";
import { HEDERA_DELEGATION_STATUS } from "@ledgerhq/live-common/families/hedera/constants";
import CheckCircle from "~/icons/CheckCircle";
import ExclamationCircle from "~/icons/ExclamationCircle";

interface Props {
  status: HEDERA_DELEGATION_STATUS;
  size?: number;
  color?: string;
}

export default function DelegationStatusIcon({ status, size = 14, color }: Readonly<Props>) {
  const { colors } = useTheme();

  if (status === HEDERA_DELEGATION_STATUS.Inactive) {
    return <ExclamationCircle size={size} color={color ?? colors.alert} />;
  }

  if (status === HEDERA_DELEGATION_STATUS.Overstaked) {
    return <ExclamationCircle size={size} color={color ?? colors.warning} />;
  }

  return <CheckCircle size={size} color={color ?? colors.green} />;
}
