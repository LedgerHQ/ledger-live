import BigNumber from "bignumber.js";
import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box, { Tabbable } from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import TachometerHigh from "~/renderer/icons/TachometerHigh";
import TachometerLow from "~/renderer/icons/TachometerLow";
import TachometerMedium from "~/renderer/icons/TachometerMedium";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { sumPrivateRecords } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount, AleoUnspentRecord } from "@ledgerhq/live-common/families/aleo/types";

export type RecordStrategy = "fast" | "balanced" | "full";

interface StrategyConfig {
  min: number;
  max: number;
  maxRecords: number;
}

const STRATEGY_CONFIG: Record<RecordStrategy, StrategyConfig> = {
  fast: { min: 1, max: 4, maxRecords: 4 },
  balanced: { min: 5, max: 8, maxRecords: 8 },
  full: { min: 9, max: 14, maxRecords: 14 },
};

/** Maps strategy name to the maxRecords limit for selectPrivateRecordsForAmount */
export const STRATEGY_MAX_RECORDS: Record<RecordStrategy, number> = {
  fast: 4,
  balanced: 8,
  full: 14,
};

const STRATEGIES: RecordStrategy[] = ["fast", "balanced", "full"];

type Props = {
  account: AleoAccount;
  onClick: (strategy: RecordStrategy) => void;
  selectedStrategy?: RecordStrategy;
};

const StrategyWrapper = styled(Tabbable)<{ selected?: boolean; disabled?: boolean }>`
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  border: ${p =>
    `1px solid ${p.selected ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c40}`};
  padding: 20px 16px;
  font-family: "Inter";
  border-radius: 4px;
  width: 140px;
  ${p => (p.disabled ? `background: ${p.theme.colors.background.default};` : "")};

  &:hover {
    cursor: ${p => (p.disabled ? "unset" : "pointer")};
  }
`;

const StrategyHeader = styled(Box)<{ selected?: boolean; disabled?: boolean }>`
  color: ${p =>
    p.selected
      ? p.theme.colors.primary.c80
      : p.disabled
        ? p.theme.colors.neutral.c40
        : p.theme.colors.neutral.c70};
`;

const StrategyValue = styled(Box)`
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const RecordCountBadge = styled(Box)<{ selected?: boolean; disabled?: boolean }>`
  flex-direction: row;
  align-items: center;
  border-radius: 3px;
  background-color: ${p =>
    p.selected
      ? p.theme.colors.primary.c80
      : p.disabled
        ? p.theme.colors.neutral.c30
        : p.theme.colors.neutral.c40};
  padding: 5px 6px;
`;

const QuickAmountSelector = ({ account, onClick, selectedStrategy }: Props) => {
  const { t } = useTranslation();
  const accountUnit = useAccountUnit(account);

  const sortedRecords: AleoUnspentRecord[] = useMemo(
    () =>
      [...(account.aleoResources?.unspentPrivateRecords ?? [])].sort((a, b) =>
        new BigNumber(b.microcredits).minus(new BigNumber(a.microcredits)).toNumber(),
      ),
    [account.aleoResources?.unspentPrivateRecords],
  );

  const totalRecords = sortedRecords.length;

  const strategyCards = useMemo(
    () =>
      STRATEGIES.map(strategy => {
        const { min, max } = STRATEGY_CONFIG[strategy];

        // Sum the top N records (1 to max), strategy is enabled only if at least `min` records exist
        const rangeRecords = sortedRecords.slice(0, max);
        const availableCount = rangeRecords.length;
        const rangeSum = sumPrivateRecords(rangeRecords);

        const disabled = totalRecords < min;
        const selected = !disabled && selectedStrategy === strategy;

        const icon =
          strategy === "fast" ? (
            <TachometerHigh size={13} />
          ) : strategy === "balanced" ? (
            <TachometerMedium size={13} />
          ) : (
            <TachometerLow size={13} />
          );

        return (
          <StrategyWrapper
            key={strategy}
            selected={selected}
            disabled={disabled}
            onClick={() => !disabled && onClick(strategy)}
          >
            <>
              <StrategyHeader
                horizontal
                alignItems="center"
                selected={selected}
                disabled={disabled}
              >
                {icon}
                <Text fontSize={0} ff="Inter|ExtraBold" uppercase ml={1} letterSpacing="0.1em">
                  {t(`aleo.shared.quickAmountSelector.strategies.${strategy}`)}
                </Text>
              </StrategyHeader>

              <StrategyValue>
                {!disabled ? (
                  <FormattedVal
                    noShrink
                    inline
                    color={selected ? "primary.c80" : "neutral.c100"}
                    fontSize={3}
                    fontWeight="600"
                    val={rangeSum}
                    unit={accountUnit}
                    showCode
                    alwaysShowValue
                  />
                ) : (
                  <Text fontSize={3} color="neutral.c40">
                    —
                  </Text>
                )}
              </StrategyValue>

              <RecordCountBadge selected={selected} disabled={disabled}>
                <Text
                  fontSize={2}
                  fontWeight="500"
                  color={selected ? "neutral.c00" : disabled ? "neutral.c40" : "neutral.c100"}
                >
                  {disabled
                    ? t("aleo.shared.quickAmountSelector.unavailable", { min, max })
                    : t("aleo.shared.quickAmountSelector.recordCount", { count: availableCount })}
                </Text>
              </RecordCountBadge>
            </>
          </StrategyWrapper>
        );
      }),
    [sortedRecords, totalRecords, selectedStrategy, accountUnit, t, onClick],
  );

  return (
    <Box horizontal justifyContent="center" flexWrap="wrap" gap="16px">
      {strategyCards}
    </Box>
  );
};

export default memo(QuickAmountSelector);
