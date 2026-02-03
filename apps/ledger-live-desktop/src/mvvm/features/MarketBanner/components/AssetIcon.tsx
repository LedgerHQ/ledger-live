import React from "react";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

export const AssetIcon = ({
  item,
  getCapitalizedTicker,
}: {
  item: MarketItemPerformer;
  getCapitalizedTicker: (item: MarketItemPerformer) => string;
}) => {
  if (item.ledgerIds && item.ledgerIds.length > 0 && item.ticker) {
    return <CryptoIcon ledgerId={item.ledgerIds[0]} ticker={item.ticker} size="40px" />;
  }

  return (
    <img
      width={40}
      height={40}
      className="overflow-hidden rounded-full"
      src={item.image}
      alt={`${getCapitalizedTicker(item)} logo`}
    />
  );
};
