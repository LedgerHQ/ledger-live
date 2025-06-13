import React from "react";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import TranslatedError from "~/components/TranslatedError";

interface Props {
  status: TransactionStatus;
}

export default function AssociationInsufficientFundsError(props: Props) {
  const { colors } = useTheme();
  const { insufficientAssociateBalance } = props.status.errors;

  if (!insufficientAssociateBalance) {
    return null;
  }

  return (
    <Text fontSize={12} fontWeight="medium" color={colors.error.c60}>
      <TranslatedError error={insufficientAssociateBalance} field="description" />
    </Text>
  );
}
