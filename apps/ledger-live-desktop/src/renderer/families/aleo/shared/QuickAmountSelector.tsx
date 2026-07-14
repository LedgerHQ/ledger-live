import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { rgba } from "@ledgerhq/react-ui/styles/helpers";
import Box, { Tabbable } from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import TachometerHigh from "~/renderer/icons/TachometerHigh";
import TachometerLow from "~/renderer/icons/TachometerLow";
import TachometerMedium from "~/renderer/icons/TachometerMedium";
import Label from "~/renderer/components/Label";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { AleoAccount, AleoTokenAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SigningStrategy } from "@ledgerhq/live-common/families/aleo/utils";
import { getEstimatedSigningTime } from "@ledgerhq/live-common/families/aleo/utils";
import { useAleoQuickAmountSelector } from "@ledgerhq/live-common/families/aleo/react";

const STRATEGY_ICONS: Record<SigningStrategy, React.ReactElement> = {
  fast: <TachometerHigh size={13} />,
  balanced: <TachometerMedium size={13} />,
  full: <TachometerLow size={13} />,
};

type Props = {
  account: AleoAccount | AleoTokenAccount;
  transaction: Transaction;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  onSelect?: () => void;
};

const QuickAmountWrapper = styled(Tabbable)<{ selected?: boolean; disabled?: boolean }>`
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
  background-color: ${p => (p.selected ? rgba(p.theme.colors.primary.c20, 0.7) : "transparent")};

  &:hover {
    cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  }
`;

const QuickAmountHeader = styled(Box)<{ selected?: boolean; disabled?: boolean }>`
  color: ${p => p.theme.colors.neutral.c70};
  ${p => p.disabled && `color: ${p.theme.colors.neutral.c40};`}
  ${p => p.selected && `color: ${p.theme.colors.primary.c80};`}
`;

const QuickAmountValue = styled(Box)`
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const WrappedFormattedVal = styled.span`
  & > * {
    white-space: normal !important;
    overflow-wrap: break-word;
    word-break: break-all;
    text-align: center;
    overflow: visible;
  }
`;

const QuickAmountBadge = styled(Box)<{ selected?: boolean; disabled?: boolean }>`
  align-items: center;
  border-radius: 3px;
  background-color: ${p => p.theme.colors.neutral.c40};
  ${p => p.disabled && `background-color: ${p.theme.colors.neutral.c30};`}
  ${p => p.selected && `background-color: ${p.theme.colors.primary.c80};`}
  padding: 5px 6px;
`;

const QuickAmountSelector = ({ account, transaction, updateTransaction, onSelect }: Props) => {
  const { t } = useTranslation();
  const accountUnit = useAccountUnit(account);

  const quickAmountSelector = useAleoQuickAmountSelector(account, transaction, updateTransaction);
  if (!quickAmountSelector.isAleo) return null;

  const { strategyData, totalSpendableBalance, selectedRecordsCount, selectStrategy } =
    quickAmountSelector;

  const selectedRecordsSigningTime = getEstimatedSigningTime(
    selectedRecordsCount,
    t("time.second_short"),
    t("time.minute_short"),
  );

  return (
    <>
      <Box flexDirection="column" gap="4px">
        <Box
          horizontal
          alignItems="center"
          gap="4px"
          data-testid="record-summary"
          style={{ visibility: selectedRecordsCount > 0 ? "visible" : "hidden" }}
        >
          <Label>
            {`${t("aleo.shared.quickAmountSelector.recordCount", { count: selectedRecordsCount })} · ${selectedRecordsSigningTime}`}
          </Label>
        </Box>
        <Box horizontal alignItems="center" gap="4px">
          <Label>{t("aleo.shared.quickAmountSelector.spendableBalance")}</Label>
          <FormattedVal
            noShrink
            inline
            marginTop={0.5}
            color="neutral.c100"
            fontSize={3}
            fontWeight="600"
            val={totalSpendableBalance}
            unit={accountUnit}
            showCode
            alwaysShowValue
            showAllDigits
          />
        </Box>
      </Box>
      <Box horizontal justifyContent="center" flexWrap="wrap" gap="16px">
        {strategyData.map(tile => {
          const { strategy, min, max, availableCount, rangeSum, disabled, selected } = tile;
          const signingTime = getEstimatedSigningTime(
            availableCount,
            t("time.second_short"),
            t("time.minute_short"),
          );

          const disabledBadgeColor = disabled ? "neutral.c40" : "neutral.c100";
          const badgeTextColor = selected ? "neutral.c00" : disabledBadgeColor;

          const handleClick = () => {
            if (disabled) return;
            selectStrategy(tile);
            onSelect?.();
          };

          return (
            <QuickAmountWrapper
              key={strategy}
              selected={selected}
              disabled={disabled}
              onClick={handleClick}
            >
              <QuickAmountHeader
                horizontal
                alignItems="center"
                selected={selected}
                disabled={disabled}
              >
                {STRATEGY_ICONS[strategy]}
                <Text fontSize={0} ff="Inter|ExtraBold" uppercase ml={1} letterSpacing="0.1em">
                  {t(`aleo.shared.quickAmountSelector.strategies.${strategy}`)}
                </Text>
              </QuickAmountHeader>

              <QuickAmountValue>
                {disabled ? (
                  <Text fontSize={3} color="neutral.c40">
                    —
                  </Text>
                ) : (
                  <WrappedFormattedVal>
                    <FormattedVal
                      inline
                      ellipsis={false}
                      color={selected ? "primary.c80" : "neutral.c100"}
                      fontSize={3}
                      fontWeight="600"
                      val={rangeSum}
                      unit={accountUnit}
                      showCode
                      alwaysShowValue
                      showAllDigits
                    />
                  </WrappedFormattedVal>
                )}
              </QuickAmountValue>

              {!disabled && (
                <Text fontSize={2} color={selected ? "primary.c80" : "neutral.c70"}>
                  {signingTime}
                </Text>
              )}

              <QuickAmountBadge selected={selected} disabled={disabled}>
                <Text fontSize={2} fontWeight="500" color={badgeTextColor}>
                  {disabled
                    ? t("aleo.shared.quickAmountSelector.unavailable", { min, max })
                    : t("aleo.shared.quickAmountSelector.recordCount", { count: availableCount })}
                </Text>
              </QuickAmountBadge>
            </QuickAmountWrapper>
          );
        })}
      </Box>
    </>
  );
};

export default memo(QuickAmountSelector);
