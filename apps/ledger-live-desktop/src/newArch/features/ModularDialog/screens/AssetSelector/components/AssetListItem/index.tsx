import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { ListItem } from "@ledgerhq/lumen-ui-react";
import { AssetType } from "../../../../types";

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
  }
};

type AssetListItemProps = AssetType & {
  onClick: (asset: AssetType) => void;
};

const renderDescriptionTag = ({
  leftElement,
  shouldDisplayId,
  assetId,
  numberOfNetworks,
}: Pick<AssetType, "leftElement" | "shouldDisplayId" | "assetId" | "numberOfNetworks">) => {
  if (!leftElement && !shouldDisplayId) {
    return undefined;
  }

  return (
    <div className="flex items-center gap-8">
      {leftElement}
      {shouldDisplayId && assetId && numberOfNetworks && (
        <div
          className="inline-flex rounded-sm bg-muted px-8 py-2"
          onClick={e => {
            e.stopPropagation();
            copyToClipboard(assetId);
          }}
        >
          <span className="text-muted body-4">{`${assetId} (${numberOfNetworks} networks)`}</span>
        </div>
      )}
    </div>
  );
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
      descriptionTag={renderDescriptionTag({
        leftElement,
        shouldDisplayId,
        assetId,
        numberOfNetworks,
      })}
      trailingContent={rightElement}
      onClick={handleClick}
      data-testid={`asset-item-ticker-${ticker.toLowerCase()}`}
      className="-outline-offset-2"
    />
  );
};
