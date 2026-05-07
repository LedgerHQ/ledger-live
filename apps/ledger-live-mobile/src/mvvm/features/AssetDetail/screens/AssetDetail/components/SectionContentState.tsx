import React from "react";
import { Box, Text, Spot } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";

type Props = Readonly<{
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
  errorMessage: string;
  skeletonKeys: readonly string[];
  listStyle: LumenViewStyle;
  skeletonStyle: LumenViewStyle;
  children: React.ReactNode;
}>;

export function SectionContentState({
  isLoading,
  isError,
  hasData,
  errorMessage,
  skeletonKeys,
  listStyle,
  skeletonStyle,
  children,
}: Props) {
  if (isLoading && !hasData) {
    return (
      <Box lx={listStyle}>
        {skeletonKeys.map(key => (
          <Box key={key} lx={skeletonStyle} />
        ))}
      </Box>
    );
  }

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
