import React from "react";
import { useTranslation } from "react-i18next";
import { MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuItem } from "@ledgerhq/lumen-ui-react";

type FeeOption = Readonly<{
  id: string;
  fiatValue: string | null;
  legendValue: string | null;
}>;

type FeePresetMenuItemsProps = Readonly<{
  hasPresets: boolean;
  hasCustom: boolean;
  hasCoinControl: boolean;
  selectedStrategy: string | null;
  onSelectStrategy: (strategy: string) => void;
  onSelectCustomFees?: () => void;
  onSelectCoinControl?: () => void;
  feeOptionsWithFiat: readonly FeeOption[];
  shouldShowFeeRateLegend: boolean;
}>;

export function FeePresetMenuItems({
  hasPresets,
  hasCustom,
  hasCoinControl,
  selectedStrategy,
  onSelectStrategy,
  onSelectCustomFees,
  onSelectCoinControl,
  feeOptionsWithFiat,
  shouldShowFeeRateLegend,
}: FeePresetMenuItemsProps) {
  const { t } = useTranslation();

  return (
    <>
      {hasPresets ? (
        <>
          <MenuRadioGroup value={selectedStrategy ?? "medium"} onValueChange={onSelectStrategy}>
            {feeOptionsWithFiat.map(option => {
              const labelKey = `fees.${option.id}`;
              const label =
                option.id && t(labelKey) !== labelKey ? t(labelKey) : option.id.toUpperCase();
              const subLabel = shouldShowFeeRateLegend ? option.legendValue : option.fiatValue;
              return (
                <MenuRadioItem key={option.id} value={option.id}>
                  <div className="flex flex-col" data-testid={`send-fees-preset-${option.id}`}>
                    <span className="text-base">{label}</span>
                    {subLabel ? <span className="body-3 text-muted">{subLabel}</span> : null}
                  </div>
                </MenuRadioItem>
              );
            })}
          </MenuRadioGroup>
          {(hasCustom || hasCoinControl) && <MenuSeparator />}
        </>
      ) : null}
      {hasCustom ? (
        <MenuItem
          data-testid="send-custom-fees-menu-item"
          onSelect={() => {
            onSelectCustomFees?.();
          }}
        >
          {t("fees.custom")}
        </MenuItem>
      ) : null}
      {hasCoinControl ? (
        <MenuItem
          data-testid="send-coin-control-fees-menu-item"
          onSelect={() => {
            onSelectCoinControl?.();
          }}
        >
          {t("fees.coinControl")}
        </MenuItem>
      ) : null}
    </>
  );
}
