import React, {
  useCallback,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ListItem,
  ListItemTitle,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTrailing,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useTranslation } from "react-i18next";

export type NetworkListItemData = {
  currency: CryptoOrTokenCurrency;
  description?: string;
  rightElement?: ReactNode;
  apy?: ReactElement;
};

type NetworkListItemProps = NetworkListItemData & {
  onClick: () => void;
  disabled?: boolean;
};

export const NetworkListItem = ({
  currency,
  description,
  rightElement,
  apy,
  onClick,
  disabled,
}: NetworkListItemProps) => {
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

  const listItem = (
    <ListItem
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      data-testid={`network-item-name-${currency.name}`}
      className="-outline-offset-2"
    >
      <ListItemLeading>
        <SquaredCryptoIcon size={48} ledgerId={currency.id} ticker={currency.ticker} />
        <ListItemContent>
          <ListItemTitle>{currency.name}</ListItemTitle>
          <ListItemDescription className="flex gap-6">
            {description}
            {apy}
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
        {t("modularAssetDrawer.unsupportedNetworkTooltip", { network: currency.name })}
      </TooltipContent>
    </Tooltip>
  );
};
