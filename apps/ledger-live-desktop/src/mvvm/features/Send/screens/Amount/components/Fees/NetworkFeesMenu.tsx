import React, { useMemo } from "react";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuItem,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@ledgerhq/lumen-ui-react";
import { ChevronUpDown, Information } from "@ledgerhq/lumen-ui-react/symbols";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { sendFeatures, getSendDescriptor } from "@ledgerhq/live-common/bridge/descriptor";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useTranslation } from "react-i18next";
import type { FeePresetOption } from "../../hooks/useFeePresetOptions";
import type { FeeFiatMap } from "../../hooks/useFeePresetFiatValues";
import type { FeePresetLegendMap } from "../../hooks/useFeePresetLegends";

type FeeOptionDisplay = Readonly<{
  id: string;
  fiatValue: string | null;
  legendValue: string | null;
  disabled?: boolean;
}>;

type NetworkFeesMenuProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  feesLabel: string;
  feesValue: string;
  feesStrategyLabel: string;
  selectedStrategy: string | null;
  onSelectStrategy: (strategy: string) => void;
  onSelectCustomFees?: () => void;
  onSelectCoinControl?: () => void;
  feePresetOptions: readonly FeePresetOption[];
  fiatByPreset: FeeFiatMap;
  legendByPreset: FeePresetLegendMap;
}>;

export function NetworkFeesMenu({
  account,
  parentAccount,
  status: _status,
  feesLabel,
  feesValue,
  feesStrategyLabel,
  selectedStrategy,
  onSelectStrategy,
  onSelectCustomFees,
  onSelectCoinControl,
  feePresetOptions,
  fiatByPreset,
  legendByPreset,
}: NetworkFeesMenuProps) {
  const { t } = useTranslation();
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const currency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  const hasPresets = sendFeatures.hasFeePresets(currency);
  const hasCustom = sendFeatures.hasCustomFees(currency);
  const hasCoinControl = sendFeatures.hasCoinControl(currency);
  const legendConfig = getSendDescriptor(currency)?.fees.presets?.legend;
  const shouldShowFeeRateLegend = legendConfig?.type === "feeRate";

  const feeOptionsWithFiat = useMemo(() => {
    if (feePresetOptions.length > 0) {
      return feePresetOptions.map(option => {
        return {
          ...option,
          fiatValue: fiatByPreset[option.id] ?? null,
          legendValue: legendByPreset[option.id] ?? null,
        };
      });
    }

    if (hasPresets) {
      const strategies = ["slow", "medium", "fast"];
      return strategies.map(strategy => {
        return {
          id: strategy,
          fiatValue: fiatByPreset[strategy] ?? null,
          legendValue: legendByPreset[strategy] ?? null,
        } satisfies FeeOptionDisplay;
      });
    }

    return [];
  }, [feePresetOptions, fiatByPreset, legendByPreset, hasPresets]);

  const hasMenuOptions = hasPresets || hasCustom || hasCoinControl;

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

  if (!hasMenuOptions) {
    return (
      <div className="flex w-full items-center justify-between py-16">
        <span className="flex items-center gap-8">
          <span className="body-2">{feesLabel}</span>
          {informationIcon}
        </span>
        <span className="text-base body-2">{feesValue}</span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between py-16">
      <span className="flex items-center gap-8">
        <span className="body-2">{feesLabel}</span>
        {informationIcon}
      </span>
      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-8 transition-colors hover:opacity-70"
          >
            <span className="text-base body-2">
              {feesValue} • {feesStrategyLabel}
            </span>
            <ChevronUpDown size={16} className="text-muted" />
          </button>
        </MenuTrigger>
        <MenuContent className="w-256" side="top">
          <MenuLabel>{feesLabel}</MenuLabel>
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
                      <div className="flex flex-col">
                        <span className="text-base">{label}</span>
                        {subLabel ? <span className="text-muted body-3">{subLabel}</span> : null}
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
              onSelect={() => {
                onSelectCustomFees?.();
              }}
            >
              {t("fees.custom")}
            </MenuItem>
          ) : null}
          {hasCoinControl ? (
            <MenuItem
              onSelect={() => {
                onSelectCoinControl?.();
              }}
            >
              {t("fees.coinControl")}
            </MenuItem>
          ) : null}
        </MenuContent>
      </Menu>
    </div>
  );
}
