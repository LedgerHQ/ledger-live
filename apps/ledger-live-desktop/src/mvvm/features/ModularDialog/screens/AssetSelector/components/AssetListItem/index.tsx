import React, { useCallback, useState, type KeyboardEvent } from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemTrailing,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { AssetType } from "../../../../types";

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
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
          <span className="body-4 text-muted">{`${assetId} (${numberOfNetworks} networks)`}</span>
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
  disabled,
}: AssetListItemProps) => {
  const { t } = useTranslation();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const handleDisabledItemClick = useCallback(() => {
    setIsTooltipOpen(true);
  }, []);

  const handleDisabledItemKeyDown = useCallback((event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    setIsTooltipOpen(true);
  }, []);

  const handleClick = () => {
    if (disabled) return;
    onClick({ name, ticker, id });
  };

  const listItem = (
    <ListItem
      className="-outline-offset-2"
      disabled={disabled}
      onClick={disabled ? undefined : handleClick}
      data-testid={`asset-item-ticker-${ticker.toLowerCase()}`}
      aria-disabled={disabled || undefined}
    >
      <ListItemLeading>
        <CryptoIcon size={48} ledgerId={id} ticker={ticker} />
        <ListItemContent>
          <ListItemTitle>{name}</ListItemTitle>
          <ListItemDescription className="flex gap-6">
            {ticker}
            {renderDescriptionTag({
              leftElement,
              shouldDisplayId,
              assetId,
              numberOfNetworks,
            })}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>{rightElement}</ListItemTrailing>
    </ListItem>
  );

  if (!disabled) {
    return listItem;
  }

  return (
    <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
      <TooltipTrigger asChild>
        <span
          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          tabIndex={0}
          role="button"
          aria-disabled
          onClick={handleDisabledItemClick}
          onKeyDown={handleDisabledItemKeyDown}
        >
          {listItem}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {t("modularAssetDrawer.unsupportedAssetTooltip", { asset: name })}
      </TooltipContent>
    </Tooltip>
  );
};
