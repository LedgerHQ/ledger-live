import React from "react";
import { Menu, MenuTrigger, MenuContent, MenuItem, IconButton } from "@ledgerhq/lumen-ui-react";
import { Eye, EyeCross, SettingsAlt2 } from "@ledgerhq/lumen-ui-react/symbols";
import type { ChartOptionsMenuViewModel } from "./useChartOptionsMenuViewModel";

export type ChartOptionsMenuViewProps = Readonly<{
  viewModel: ChartOptionsMenuViewModel;
}>;

export function ChartOptionsMenuView({ viewModel }: ChartOptionsMenuViewProps) {
  const { optionsAriaLabel, toggleLabel, isHidden, onToggle } = viewModel;

  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton
            appearance="no-background"
            size="xs"
            icon={SettingsAlt2}
            aria-label={optionsAriaLabel}
            data-testid="asset-detail-chart-options-trigger"
          />
        }
      />
      <MenuContent className="w-full min-w-200" side="bottom" align="end">
        <MenuItem
          onClick={() => {
            onToggle();
          }}
          data-testid="asset-detail-chart-options-toggle-transactions"
        >
          <span className="flex items-center gap-12">
            {isHidden ? (
              <Eye size={20} className="shrink-0" />
            ) : (
              <EyeCross size={20} className="shrink-0" />
            )}
            {toggleLabel}
          </span>
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
