import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
} from "@ledgerhq/lumen-ui-react";
import type { EarnSimulatorViewModel } from "./hooks/useEarnSimulatorViewModel";
import SimulatorBarChart from "./components/SimulatorBarChart";
import ChartLegend from "./components/ChartLegend";
import DepositSlider from "./components/DepositSlider";
import CurrencyApySelector from "./components/CurrencyApySelector";

const CHART_WIDTH = 360;
const CHART_HEIGHT = 180;

// TODO: use formatCurrency fns
const formatDollar = (value: number) =>
  `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const formatDollarCents = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DEPOSIT_COLOR = "#6B6B80";
const REWARDS_COLOR = "#30D158";

type Props = EarnSimulatorViewModel;

const EarnSimulatorDialogView = ({
  isOpen,
  currencyName,
  apy,
  initialDeposit,
  monthlyDeposit,
  chartData,
  totalRewards,
  initialDepositConfig,
  monthlyDepositConfig,
  onInitialDepositChange,
  onMonthlyDepositChange,
  onSelectCurrency,
  onEarnPress,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  const legendItems = useMemo(
    () => [
      { label: t("earn.simulator.rewards"), color: REWARDS_COLOR },
      { label: t("earn.simulator.deposits"), color: DEPOSIT_COLOR },
    ],
    [t],
  );

  const handleClose = useCallback(() => onClose(), [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] rounded-xl " aria-describedby={undefined}>
        <DialogHeader
          appearance="compact"
          title={t("earn.simulator.title")}
          onClose={handleClose}
        />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto px-24">
          <CurrencyApySelector currencyName={currencyName} apy={apy} onPress={onSelectCurrency} />

          <div className="flex flex-col items-center gap-4">
            <span className="body-3 text-muted">{t("earn.simulator.totalRewards")}</span>
            <span className="heading-3-semi-bold text-base">{formatDollarCents(totalRewards)}</span>
          </div>

          <div className="flex flex-col gap-12">
            <ChartLegend items={legendItems} />
            <SimulatorBarChart
              data={chartData}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              depositColor={DEPOSIT_COLOR}
              rewardsColor={REWARDS_COLOR}
            />
          </div>

          <div className="flex flex-col gap-24">
            <DepositSlider
              label={t("earn.simulator.initialDeposit")}
              value={initialDeposit}
              min={initialDepositConfig.min}
              max={initialDepositConfig.max}
              step={initialDepositConfig.step}
              formatValue={formatDollar}
              onValueChange={onInitialDepositChange}
            />
            <DepositSlider
              label={t("earn.simulator.monthlyDeposit")}
              value={monthlyDeposit}
              min={monthlyDepositConfig.min}
              max={monthlyDepositConfig.max}
              step={monthlyDepositConfig.step}
              formatValue={formatDollar}
              onValueChange={onMonthlyDepositChange}
            />
          </div>
        </DialogBody>
        <DialogFooter className="justify-center">
          <Button appearance="base" isFull onClick={onEarnPress}>
            {t("earn.simulator.earnCurrency", { currency: currencyName })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EarnSimulatorDialogView;
