import React from "react";
import { Image } from "react-native";
import Icon from "@ledgerhq/crypto-icons/native";

interface MarketTileIconProps {
  ticker: string;
  ledgerIds: string[];
  image?: string;
}

const MarketTileIcon = ({ ticker, ledgerIds, image }: MarketTileIconProps) => {
  return ledgerIds && ledgerIds.length > 0 && ticker ? (
    <Icon ledgerId={ledgerIds?.[0]} ticker={ticker} size={40} />
  ) : (
    <Image
      source={{ uri: image }}
      style={{ width: 40, height: 40, borderRadius: 20 }}
      resizeMode="cover"
    />
  );
};

export default React.memo(MarketTileIcon);
