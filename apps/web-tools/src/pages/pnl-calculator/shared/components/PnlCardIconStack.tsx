import type { ComponentProps } from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { PnlCardIcon } from "./types";

type CryptoIconSize = ComponentProps<typeof CryptoIcon>["size"];

type PnlCardIconStackProps = Readonly<{
  icons: PnlCardIcon[];
  size?: CryptoIconSize;
}>;

export function PnlCardIconStack({ icons, size = 48 }: PnlCardIconStackProps) {
  if (icons.length === 0) return null;
  return (
    <>
      {icons.map(icon => (
        <CryptoIcon
          key={`${icon.ledgerId}-${icon.ticker}`}
          ledgerId={icon.ledgerId}
          ticker={icon.ticker}
          size={size}
        />
      ))}
    </>
  );
}
