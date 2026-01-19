import React from "react";
import Icon from "@ledgerhq/crypto-icons/native";

interface MarketTileIconProps {
  ticker: string;
  ledgerIds: string[];
}

const MarketTileIcon = ({ ticker, ledgerIds }: MarketTileIconProps) => {
  return <Icon ledgerId={ledgerIds?.[0]} ticker={ticker} size={32} />;
};

export default React.memo(MarketTileIcon);
