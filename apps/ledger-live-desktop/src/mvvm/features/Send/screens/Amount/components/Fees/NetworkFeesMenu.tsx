import React, { useMemo } from "react";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuGroup,
  MenuLabel,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@ledgerhq/lumen-ui-react";
import { ChevronUpDown, Information } from "@ledgerhq/lumen-ui-react/symbols";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useTranslation } from "react-i18next";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import type { FeePresetOption } from "../../../../hooks/useFeePresetOptions";
import type { FeeFiatMap } from "../../../../hooks/useFeePresetFiatValues";
import type { FeePresetLegendMap } from "../../../../hooks/useFeePresetLegends";
import { FeePresetMenuItems } from "./FeePresetMenuItems";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";

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
  const { options: feePresetOptions = [], fiatByPreset = {}, legendByPreset = {} } = presets;
  const { onSelectCustomFees, onSelectCoinControl } = actions ?? {};
  const { t } = useTranslation();
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;
  const { transaction, status } = state.transaction;
  const { currentStep } = useFlowWizard();

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
  const fallbackPresetIds = useMemo(
    () =>
      currency && transaction ? sendFeatures.getFeePresetFallbackIds(currency, transaction) : [],
    [currency, transaction],
  );

  const feeOptionsWithFiat = useMemo(() => {
    const options = feePresetOptions ?? [];
    if (options.length > 0) {
      return options.map(option => {
        return {
          ...option,
          fiatValue: fiatByPreset[option.id] ?? null,
          legendValue: legendByPreset[option.id] ?? null,
        };
      });
    }

    if (hasPresetsForCurrency && fallbackPresetIds.length > 0) {
      return fallbackPresetIds.map(presetId => {
        return {
          id: presetId,
          fiatValue: fiatByPreset[presetId] ?? null,
          legendValue: legendByPreset[presetId] ?? null,
        } satisfies FeeOptionDisplay;
      });
    }

    return [];
  }, [feePresetOptions, fiatByPreset, legendByPreset, hasPresetsForCurrency, fallbackPresetIds]);

  if (!account || !transaction || !mainAccount || !currency) {
    return null;
  }

  const hasPresets = sendFeatures.hasFeePresets(currency);
  const hasCustom =
    sendFeatures.hasCustomFees(currency) && !!sendFeatures.getCustomFeeConfig(currency);
  const hasCoinControl = sendFeatures.hasCoinControl(currency);
  const showCoinControlMenuItem = hasCoinControl && currentStep !== SEND_FLOW_STEP.COIN_CONTROL;
  const shouldShowFeeRateLegend = sendFeatures.hasFeeRateLegend(currency);

  const hasMenuOptions = hasPresets || hasCustom || hasCoinControl;

  const networkFeesInfo = sendFeatures.getNetworkFeesInfo(currency, { transaction, status });

  const informationIcon = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Information size={16} className="text-muted" />
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {networkFeesInfo
            ? t(`newSendFlow.${networkFeesInfo.translationKey}.description`, networkFeesInfo.values)
            : t("newSendFlow.feesPaid")}
        </p>
      </TooltipContent>
    </Tooltip>
  );

  if (!hasMenuOptions) {
    return (
      <div
        className="flex w-full items-center justify-between mt-16 mb-12"
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
            <FeePresetMenuItems
              hasPresets={hasPresets}
              hasCustom={hasCustom}
              hasCoinControl={showCoinControlMenuItem}
              selectedStrategy={selectedStrategy}
              onSelectStrategy={onSelectStrategy}
              onSelectCustomFees={onSelectCustomFees}
              onSelectCoinControl={onSelectCoinControl}
              feeOptionsWithFiat={feeOptionsWithFiat}
              shouldShowFeeRateLegend={shouldShowFeeRateLegend}
            />
          </MenuGroup>
        </MenuContent>
      </Menu>
    </div>
  );
}
