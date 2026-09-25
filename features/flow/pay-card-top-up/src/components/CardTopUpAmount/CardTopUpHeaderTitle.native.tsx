import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

type CardTopUpHeaderTitleProps = Readonly<{
  title: string;
  description: string;
}>;

/** The top-up screen's navigation header: the asset on top, the source account below. */
export function CardTopUpHeaderTitle({ title, description }: CardTopUpHeaderTitleProps) {
  return (
    <Box lx={{ alignItems: "center" }}>
      <Text typography="heading4SemiBold" lx={{ color: "base" }} numberOfLines={1}>
        {title}
      </Text>
      <Text typography="body2" lx={{ color: "muted" }} numberOfLines={1}>
        {description}
      </Text>
    </Box>
  );
}
