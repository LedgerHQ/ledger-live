import React from "react";
import { Banner, Box, Button, DescriptionItemValue, Text } from "@ledgerhq/lumen-ui-rnative";
import { PositionAmount, PositionRow } from "../PositionRows";
import type { StakePositionConfirmViewProps } from "./StakePositionConfirmView.types";

export function StakePositionConfirmView({
  labels,
  amount,
  validatorName,
  fees,
  errorContent,
  isPending,
  isConfirmDisabled,
  onConfirm,
  testID,
}: StakePositionConfirmViewProps) {
  return (
    <Box lx={{ gap: "s24" }} testID={testID}>
      <Text typography="body2" lx={{ color: "muted" }}>
        {labels.description}
      </Text>
      <Box lx={{ gap: "s12" }}>
        <PositionRow label={labels.amount}>
          <PositionAmount amount={amount} />
        </PositionRow>
        <PositionRow label={labels.validator}>
          <DescriptionItemValue>{validatorName}</DescriptionItemValue>
        </PositionRow>
        {fees ? (
          <PositionRow label={labels.fees}>
            <DescriptionItemValue>{fees}</DescriptionItemValue>
          </PositionRow>
        ) : null}
      </Box>
      {errorContent ? <Banner appearance="error" description={errorContent} /> : null}
      <Button
        appearance="base"
        size="lg"
        isFull
        loading={isPending}
        disabled={isConfirmDisabled}
        onPress={onConfirm}
      >
        {labels.cta}
      </Button>
    </Box>
  );
}
