import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";

export function renderWalletCarouselMediaTitleChildren(title: string): React.ReactNode {
  const normalized = title.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const parts = normalized.split(/<bold>(.*?)<\/bold>/g);

  return parts.map((part, index) => {
    if (index % 2 !== 0) {
      const text = part.replace(/<bold>(.*?)<\/bold>/g, "$1");
      return (
        <Text
          key={`wallet_carousel_title_${index}`}
          typography="heading3SemiBold"
          lx={{ color: "active" }}
        >
          {" "}
          {text}{" "}
        </Text>
      );
    }
    return part;
  });
}
