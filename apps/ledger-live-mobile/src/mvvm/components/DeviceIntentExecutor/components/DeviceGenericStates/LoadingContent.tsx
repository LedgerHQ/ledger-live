import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";

type LoadingContentProps = Readonly<{
  title: React.ReactNode;
  testID?: string;
}>;

export function LoadingContent({ title, testID }: LoadingContentProps) {
  return (
    <Box lx={rootStyle} testID={testID}>
      <Spinner size={32} />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {title}
      </Text>
    </Box>
  );
}

const rootStyle = {
  alignItems: "center",
  gap: "s16",
  paddingBottom: "s56",
  paddingTop: "s32",
  width: "full",
} as const;
