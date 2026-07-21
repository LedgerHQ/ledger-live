import React from "react";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuItem,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@ledgerhq/lumen-ui-react";
import { ChevronUpDown, Information, Check } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import type { FeeSelectorOption } from "../../types";

type FeesDisplay = Readonly<{
  label: string;
  value: string;
  strategyLabel: string;
}>;

type FeesSelector = Readonly<{
  options: readonly FeeSelectorOption[];
  selectedId: string;
  canOpen: boolean;
}>;

type NetworkFeesMenuProps = Readonly<{
  display: FeesDisplay;
  feeSelector: FeesSelector;
}>;

export function NetworkFeesMenu({ display, feeSelector }: NetworkFeesMenuProps) {
  const { label: feesLabel, value: feesValue, strategyLabel: feesStrategyLabel } = display;
  const { options, selectedId, canOpen } = feeSelector;
  const { t } = useTranslation();
  const { state } = useSendFlowData();
  const { account } = state.account;
  const { transaction } = state.transaction;

  if (!account || !transaction) {
    return null;
  }

  const strategyOptions = options.filter(
    option => option.kind === "preset" || option.kind === "default",
  );
  const customOption = options.find(option => option.kind === "custom");
  const coinControlOption = options.find(option => option.kind === "coinControl");

  const informationIcon = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Information size={16} className="text-muted" />
      </TooltipTrigger>
      <TooltipContent>
        <p>{t("newSendFlow.feesPaid")}</p>
      </TooltipContent>
    </Tooltip>
  );

  if (!canOpen) {
    return (
      <div
        className="flex w-full items-center justify-between mt-8 mb-12"
        data-testid="send-network-fees-row"
      >
        <span className="flex items-center gap-8">
          <span className="body-3">{feesLabel}</span>
          {informationIcon}
        </span>
        <span className="body-3 text-base">{feesValue}</span>
      </div>
    );
  }

  return (
    <div
      className="flex w-full items-center justify-between mt-16 mb-12"
      data-testid="send-network-fees-row"
    >
      <span className="flex items-center gap-8">
        <span className="body-3">{feesLabel}</span>
        {informationIcon}
      </span>
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-8 transition-colors hover:opacity-70  cursor-pointer"
              data-testid="send-network-fees-menu-trigger"
            >
              <span className="body-3 text-base">
                {feesValue} • {feesStrategyLabel}
              </span>
              <ChevronUpDown size={16} className="text-muted" />
            </button>
          }
        />
        <MenuContent className="pointer-events-auto w-256" side="top">
          <MenuGroup>
            <MenuLabel>{feesLabel}</MenuLabel>
            {strategyOptions.length > 0 ? (
              <MenuRadioGroup
                value={selectedId}
                onValueChange={id => {
                  const option = options.find(o => o.id === id);
                  option?.onSelect();
                }}
              >
                {strategyOptions.map(option => (
                  <MenuRadioItem
                    key={option.id}
                    value={option.id}
                    closeOnClick
                    className="cursor-pointer"
                    data-testid={`send-fees-preset-${option.id}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-base">{option.label}</span>
                      {option.sublabel ? (
                        <span className="body-3 text-muted">{option.sublabel}</span>
                      ) : null}
                    </div>
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            ) : null}
            {strategyOptions.length > 0 && (customOption || coinControlOption) ? (
              <MenuSeparator />
            ) : null}
            {customOption ? (
              <MenuItem
                className="cursor-pointer"
                data-testid="send-custom-fees-menu-item"
                onClick={() => {
                  customOption.onSelect();
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-base">{customOption.label}</span>
                  {customOption.selected ? <Check size={16} /> : null}
                </div>
              </MenuItem>
            ) : null}
            {coinControlOption ? (
              <MenuItem
                className="cursor-pointer"
                data-testid="send-coin-control-fees-menu-item"
                onClick={() => {
                  coinControlOption.onSelect();
                }}
              >
                {coinControlOption.label}
              </MenuItem>
            ) : null}
          </MenuGroup>
        </MenuContent>
      </Menu>
    </div>
  );
}
