import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

type ChangeToReturnProps = Readonly<{
  value?: string;
  changeToReturnLabel: string;
  enterAmountPlaceholder: string;
}>;

export const ChangeToReturn = ({
  value,
  changeToReturnLabel,
  enterAmountPlaceholder,
}: ChangeToReturnProps) => {
  return (
    <Box
      lx={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: "s8" }}
      data-testid="send-change-to-return-row"
    >
      <Text typography="body3" lx={{ color: "base" }}>
        {changeToReturnLabel}
      </Text>
      {value ? (
        <Text typography="body3" lx={{ color: "base" }}>
          {value}
        </Text>
      ) : (
        <Text typography="body3" lx={{ color: "warning" }}>
          {enterAmountPlaceholder}
        </Text>
      )}
    </Box>
  );
};
