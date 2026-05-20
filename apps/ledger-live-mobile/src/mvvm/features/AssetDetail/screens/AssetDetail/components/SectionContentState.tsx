import React from "react";
import { Box, Text, Spot } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";

type Props = Readonly<{
  isError: boolean;
  hasData: boolean;
  errorMessage: string;
  children: React.ReactNode;
}>;

export function SectionContentState({ isError, hasData, errorMessage, children }: Props) {
  if (isError && !hasData) {
    return (
      <Box lx={errorContainerStyle}>
        <Spot appearance="icon" icon={Warning} size={40} />
        <Text
          typography="body2SemiBold"
          lx={{ color: "base", textAlign: "center", marginTop: "s8" }}
        >
          {errorMessage}
        </Text>
      </Box>
    );
  }

  if (!hasData) return null;

  return <>{children}</>;
}

const errorContainerStyle: LumenViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: "s16",
};
