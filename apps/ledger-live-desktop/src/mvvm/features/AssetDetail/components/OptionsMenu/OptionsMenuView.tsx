import React from "react";
import { Menu, MenuTrigger, MenuContent, MenuItem, IconButton } from "@ledgerhq/lumen-ui-react";
import { Eye, EyeCross, MoreVertical, Star, StarFill } from "@ledgerhq/lumen-ui-react/symbols";
import type { OptionsMenuViewModel } from "./useOptionsMenuViewModel";

export type OptionsMenuViewProps = Readonly<{
  viewModel: OptionsMenuViewModel;
}>;

export function OptionsMenuView({ viewModel }: OptionsMenuViewProps) {
  const {
    showMenu,
    optionsAriaLabel,
    addFavouriteLabel,
    removeFavouriteLabel,
    hideFromPortfolioLabel,
    showInPortfolioLabel,
    isStarred,
    isStarEnabled,
    isHideFromPortfolioEnabled,
    isHiddenFromPortfolio,
    onToggleStar,
    onHideFromPortfolio,
    onShowInPortfolio,
  } = viewModel;

  if (!showMenu) return null;

  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton
            appearance="gray"
            size="sm"
            icon={MoreVertical}
            aria-label={optionsAriaLabel}
            data-testid="asset-detail-header-options-trigger"
            className="mr-4"
          />
        }
      />
      <MenuContent className="w-full min-w-200" side="bottom" align="end">
        <MenuItem
          disabled={!isStarEnabled}
          data-testid={isStarred ? "asset-detail-remove-favorite" : "asset-detail-add-favorite"}
          onClick={() => {
            onToggleStar();
          }}
        >
          <span className="flex items-center gap-12">
            {isStarred ? (
              <StarFill size={20} className="shrink-0" />
            ) : (
              <Star size={20} className="shrink-0 fill-none" />
            )}
            {isStarred ? removeFavouriteLabel : addFavouriteLabel}
          </span>
        </MenuItem>
        {isHideFromPortfolioEnabled && (
          <MenuItem
            onClick={() => {
              if (isHiddenFromPortfolio) {
                onShowInPortfolio();
              } else {
                onHideFromPortfolio();
              }
            }}
          >
            <span className="flex items-center gap-12">
              {isHiddenFromPortfolio ? (
                <Eye size={20} className="shrink-0" />
              ) : (
                <EyeCross size={20} className="shrink-0" />
              )}
              {isHiddenFromPortfolio ? showInPortfolioLabel : hideFromPortfolioLabel}
            </span>
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}
