import React from "react";
import { TFunction } from "i18next";
import {
  Button,
  IconButton,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@ledgerhq/lumen-ui-react";
import { MoreVertical, Plus, Chart5, Star, StarFill } from "@ledgerhq/lumen-ui-react/symbols";

type RowAction = {
  available: boolean;
  onClick: (e: React.SyntheticEvent) => void;
};

export type MarketRowActionsProps = {
  ticker: string;
  swapAction: RowAction;
  buySellAction: RowAction;
  earnAction: RowAction & { label: string };
  isStarred: boolean;
  onFavouriteSelect: () => void;
  onMenuOpenChange: (open: boolean) => void;
  t: TFunction;
};

export function MarketRowActions({
  ticker,
  swapAction,
  buySellAction,
  earnAction,
  isStarred,
  onFavouriteSelect,
  onMenuOpenChange,
  t,
}: MarketRowActionsProps) {
  return (
    <div
      className="flex items-center justify-end gap-8"
      onClick={e => e.stopPropagation()}
      role="presentation"
    >
      {swapAction.available && (
        <Button
          size="sm"
          appearance="base"
          onClick={swapAction.onClick}
          data-testid={`market-${ticker}-swap-button`}
        >
          {t("accounts.contextMenu.swap")}
        </Button>
      )}
      <Menu onOpenChange={onMenuOpenChange}>
        <MenuTrigger
          render={
            <IconButton
              icon={MoreVertical}
              size="sm"
              appearance="transparent"
              aria-label={t("market.marketTable.menu.more")}
              data-testid={`market-${ticker}-actions-menu`}
            />
          }
        />
        <MenuContent>
          {buySellAction.available && (
            <MenuItem className="cursor-pointer" onClick={buySellAction.onClick}>
              <Plus size={20} />
              {t("market.marketTable.menu.buySell")}
            </MenuItem>
          )}
          {earnAction.available && (
            <MenuItem className="cursor-pointer" onClick={earnAction.onClick}>
              <Chart5 size={20} />
              {earnAction.label}
            </MenuItem>
          )}
          <MenuItem className="cursor-pointer" onClick={onFavouriteSelect}>
            {isStarred ? <StarFill size={20} /> : <Star size={20} />}
            {isStarred
              ? t("market.marketTable.menu.removeFromFavourites")
              : t("market.marketTable.menu.addToFavourites")}
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}
