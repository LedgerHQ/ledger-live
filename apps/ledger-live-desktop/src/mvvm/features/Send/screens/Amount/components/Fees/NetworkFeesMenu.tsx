import React, { useMemo } from "react";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuLabel,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@ledgerhq/lumen-ui-react";
import { ChevronUpDown, Information } from "@ledgerhq/lumen-ui-react/symbols";
import { sendFeatures, getSendDescriptor } from "@ledgerhq/live-common/bridge/descriptor";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useTranslation } from "react-i18next";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import type { FeePresetOption } from "../../hooks/useFeePresetOptions";
import type { FeeFiatMap } from "../../hooks/useFeePresetFiatValues";
import type { FeePresetLegendMap } from "../../hooks/useFeePresetLegends";
import { FeePresetMenuItems } from "./FeePresetMenuItems";

type FeeOptionDisplay = Readonly<{
  id: string;
  fiatValue: string | null;
  legendValue: string | null;
  disabled?: boolean;
}>;

type FeesDisplay = Readonly<{
  label: string;
  value: string;
  strategyLabel: string;
}>;

type FeesSelection = Readonly<{
  selectedStrategy: string | null;
  onSelectStrategy: (strategy: string) => void;
}>;

type FeesPresetsData = Readonly<{
  options: readonly FeePresetOption[];
  fiatByPreset: FeeFiatMap;
  legendByPreset: FeePresetLegendMap;
}>;

type FeesActions = Readonly<{
  onSelectCustomFees?: () => void;
  onSelectCoinControl?: () => void;
}>;

type NetworkFeesMenuProps = Readonly<{
  display: FeesDisplay;
  selection: FeesSelection;
  presets: FeesPresetsData;
  actions?: FeesActions;
}>;

export function NetworkFeesMenu({ display, selection, presets, actions }: NetworkFeesMenuProps) {
  const { label: feesLabel, value: feesValue, strategyLabel: feesStrategyLabel } = display;
  const { selectedStrategy, onSelectStrategy } = selection;
  const { options: feePresetOptions, fiatByPreset, legendByPreset } = presets;
  const { onSelectCustomFees, onSelectCoinControl } = actions ?? {};
  const { t } = useTranslation();
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;
  const { transaction } = state.transaction;

  const mainAccount = useMemo(
    () => (account ? getMainAccount(account, parentAccount ?? undefined) : null),
    [account, parentAccount],
  );
  const currency = useMemo(
    () => (mainAccount ? getAccountCurrency(mainAccount) : null),
    [mainAccount],
  );

  const hasPresetsForCurrency = useMemo(
    () => (currency ? sendFeatures.hasFeePresets(currency) : false),
    [currency],
  );

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

    if (hasPresetsForCurrency) {
      const strategies = ["slow", "medium", "fast"] as const;
      return strategies.map(strategy => {
        return {
          id: strategy,
          fiatValue: fiatByPreset[strategy] ?? null,
          legendValue: legendByPreset[strategy] ?? null,
        } satisfies FeeOptionDisplay;
      });
    }

    return [];
  }, [feePresetOptions, fiatByPreset, legendByPreset, hasPresetsForCurrency]);

  if (!account || !transaction || !mainAccount || !currency) {
    return null;
  }

  const hasPresets = sendFeatures.hasFeePresets(currency);
  const hasCustom = sendFeatures.hasCustomFees(currency);
  const hasCoinControl = sendFeatures.hasCoinControl(currency);
  const legendConfig = getSendDescriptor(currency)?.fees.presets?.legend;
  const shouldShowFeeRateLegend = legendConfig?.type === "feeRate";

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
        <span className="body-2 text-base">{feesValue}</span>
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
            <span className="body-2 text-base">
              {feesValue} • {feesStrategyLabel}
            </span>
            <ChevronUpDown size={16} className="text-muted" />
          </button>
        </MenuTrigger>
        <MenuContent className="w-256" side="top">
          <MenuLabel>{feesLabel}</MenuLabel>
          <FeePresetMenuItems
            hasPresets={hasPresets}
            hasCustom={hasCustom}
            hasCoinControl={hasCoinControl}
            selectedStrategy={selectedStrategy}
            onSelectStrategy={onSelectStrategy}
            onSelectCustomFees={onSelectCustomFees}
            onSelectCoinControl={onSelectCoinControl}
            feeOptionsWithFiat={feeOptionsWithFiat}
            shouldShowFeeRateLegend={shouldShowFeeRateLegend}
          />
        </MenuContent>
      </Menu>
    </div>
  );
}
