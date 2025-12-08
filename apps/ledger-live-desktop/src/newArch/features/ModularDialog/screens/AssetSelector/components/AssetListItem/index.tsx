import React from "react";
import { CryptoIcon, AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { ListItem } from "@ledgerhq/ldls-ui-react";

type AssetListItemProps = AssetType & {
  onClick: (asset: AssetType) => void;
};

export const AssetListItem = ({
  name,
  ticker,
  id,
  onClick,
  leftElement,
  rightElement,
  numberOfNetworks,
  assetId,
  shouldDisplayId,
}: AssetListItemProps) => {
  const handleClick = () => {
    onClick({ name, ticker, id });
  };

  return (
    <ListItem
      title={name}
      leadingContent={<CryptoIcon size="48px" ledgerId={id} ticker={ticker} />}
      description={ticker}
      descriptionTag={
        leftElement || shouldDisplayId ? (
          <div className="flex items-center gap-8">
            {leftElement}
            {shouldDisplayId && assetId && numberOfNetworks && (
              <div className="bg-muted inline-flex rounded-sm px-8 py-2">
                <span className="body-4 text-muted">{`${assetId} (${numberOfNetworks} networks)`}</span>
              </div>
            )}
          </div>
        ) : undefined
      }
      trailingContent={rightElement}
      onClick={handleClick}
      data-testid={`asset-item-ticker-${ticker.toLowerCase()}`}
    />
  );
};
