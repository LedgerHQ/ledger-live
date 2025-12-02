import React from "react";
import { CryptoIcon, AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { ListItem } from "@ledgerhq/ldls-ui-react";
import { Text } from "@ledgerhq/react-ui";

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

  const leadingContent = <CryptoIcon size="48px" ledgerId={id} ticker={ticker} />;

  const customDescription = (
    <div className="flex items-center gap-2">
      <Text
        variant="body"
        fontWeight="medium"
        fontSize="12px"
        lineHeight="16px"
        color="neutral.c70"
        data-testid={`asset-item-ticker-${ticker}`}
      >
        {ticker}
      </Text>
      {leftElement}
      {shouldDisplayId && assetId && (
        <div className="inline-flex px-2 py-0.5 rounded bg-palette-background-default shrink-0">
          <Text variant="body" fontSize="12px" color="neutral.c70">
            {`${assetId} (${numberOfNetworks} networks)`}
          </Text>
        </div>
      )}
    </div>
  );

  const getTrailingContent = () => {
    const hasCustomContent = leftElement || shouldDisplayId;

    if (hasCustomContent) {
      return (
        <>
          {customDescription}
          {rightElement}
        </>
      );
    }

    return rightElement;
  };

  return (
    <ListItem
      title={name}
      leadingContent={leadingContent}
      description={leftElement || shouldDisplayId ? undefined : ticker}
      trailingContent={getTrailingContent()}
      onClick={handleClick}
      data-testid={`asset-item-${ticker}`}
    />
  );
};
