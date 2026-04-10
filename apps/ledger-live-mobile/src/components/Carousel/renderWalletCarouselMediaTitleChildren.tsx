import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";

export function renderWalletCarouselMediaTitleChildren(title: string): React.ReactNode {
  const normalized = title.replaceAll("&lt;", "<").replaceAll("&gt;", ">");
  const parts = normalized.split(/<bold>(.*?)<\/bold>/g);

  let boldSegmentId = 0;
  return parts.map((part, index) => {
    if (index % 2 !== 0) {
      boldSegmentId += 1;
      const text = part.replaceAll(/<bold>(.*?)<\/bold>/g, "$1");
      return (
        <Text
          key={`wallet_carousel_bold_${boldSegmentId}`}
          typography="heading3SemiBold"
          lx={{ color: "active" }}
        >
          {" "}
          {text}
          {" "}
        </Text>
      );
    }
    return part;
  });
}
