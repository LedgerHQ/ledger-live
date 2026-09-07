import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { CryptoIconSize } from "LLD/components/SquaredCryptoIcon";
import { IconStack, type IconStackProps } from "LLD/components/IconStack";

export type CryptoIconStackItem = Readonly<{
  ledgerId: string;
  ticker: string;
}>;

export type CryptoIconStackProps = Omit<
  IconStackProps<CryptoIconStackItem>,
  "renderItem" | "getItemKey" | "getTooltipContent" | "size"
> &
  Readonly<{
    size: CryptoIconSize;
    getTooltipContent?: IconStackProps<CryptoIconStackItem>["getTooltipContent"];
  }>;

function formatTickers(items: readonly CryptoIconStackItem[]) {
  return items.map(item => item.ticker).join(", ");
}

export function CryptoIconStack({
  items,
  size,
  borderRadius = "50%",
  getTooltipContent = formatTickers,
  ...iconStackProps
}: CryptoIconStackProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <IconStack
      {...iconStackProps}
      items={items}
      size={size}
      borderRadius={borderRadius}
      getItemKey={item => item.ledgerId}
      renderItem={item => <CryptoIcon ledgerId={item.ledgerId} ticker={item.ticker} size={size} />}
      getTooltipContent={getTooltipContent}
    />
  );
}
