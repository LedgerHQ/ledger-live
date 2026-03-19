import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

type AssetIconProps = {
  readonly ledgerId?: string;
  readonly ticker?: string;
  readonly image?: string;
  readonly capitalizedTicker: string;
};

export const AssetIcon = ({ ledgerId, ticker, image, capitalizedTicker }: AssetIconProps) => {
  if (ledgerId && ticker) {
    return <CryptoIcon ledgerId={ledgerId} ticker={ticker} size="40px" />;
  }

  return (
    <img
      width={40}
      height={40}
      className="overflow-hidden rounded-full"
      src={image}
      alt={`${capitalizedTicker} logo`}
    />
  );
};
