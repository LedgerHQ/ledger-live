import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { CoinControlChangeToReturnViewModel } from "@ledgerhq/live-common/flows/send/coinControl/hooks/useCoinControlScreenViewModelCore";

type ChangeToReturnProps = Readonly<{
  changeToReturn: CoinControlChangeToReturnViewModel;
}>;

export const ChangeToReturn = ({ changeToReturn }: ChangeToReturnProps) => {
  return (
    <Box
      lx={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingBottom: "s8",
        paddingTop: "s16",
      }}
      data-testid="send-change-to-return-row"
    >
      <Text typography="body3" lx={{ color: "base" }}>
        {changeToReturn.changeToReturnLabel}
      </Text>
      {changeToReturn.value ? (
        <Text typography="body3" lx={{ color: "base" }}>
          {changeToReturn.value}
        </Text>
      ) : (
        <Text typography="body3" lx={{ color: "warning" }}>
          {changeToReturn.placeholder}
        </Text>
      )}
    </Box>
  );
};
