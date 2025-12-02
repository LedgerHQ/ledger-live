import React from "react";
import { ListItem } from "@ledgerhq/ldls-ui-react";
import CryptoIcon from "~/renderer/components/CryptoCurrencyIcon";
import { Asset } from "../../types";

type AssetItemProps = {
  asset: Asset;
  onClick: () => void;
};

export const AssetItem = ({ asset, onClick }: AssetItemProps) => {
  return (
    <ListItem
      title={asset.name}
      description={asset.ticker}
      leadingContent={<CryptoIcon currency={asset.currency} size={40} />}
      onClick={onClick}
    />
  );
};
