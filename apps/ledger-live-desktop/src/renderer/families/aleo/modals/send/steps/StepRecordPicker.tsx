import React, { useMemo } from "react";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { rgba } from "@ledgerhq/react-ui/styles/helpers";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { AleoUnspentRecord } from "@ledgerhq/live-common/families/aleo/types";
import { isPublicTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { useSelector } from "LLD/hooks/redux";
import Label from "~/renderer/components/Label";
import type { StepProps } from "~/renderer/modals/Send/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";
import Box from "~/renderer/components/Box/Box";
import { Flex } from "@ledgerhq/react-ui/index";
import { dayFormat, hourFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import Alert from "~/renderer/components/Alert";

interface ButtonState {
  $checked?: boolean;
  disabled?: boolean;
}

const StyledButton = styled.button<ButtonState>`
  flex: 1;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 4px;
  background-color: ${p => (p.$checked ? rgba(p.theme.colors.primary.c20, 0.7) : "transparent")};
  border: 1px solid ${p => (p.$checked ? p.theme.colors.primary.c50 : p.theme.colors.neutral.c40)};
  border-radius: ${p => `${p.theme.radii[2]}px`};
  pointer-events: ${p => (p.disabled ? "none" : "auto")};
  font-size: 13px;
  color: ${p => p.theme.colors.neutral.c100};
  font-weight: 600;
  padding: 15px;
  &:hover {
    border-color: ${p => {
      if (p.disabled) {
        return p.$checked ? p.theme.colors.primary.c50 : p.theme.colors.neutral.c40;
      }
      return p.theme.colors.primary.c50;
    }};
    background-color: ${p =>
      p.$checked ? p.theme.colors.primary.c20 : rgba(p.theme.colors.primary.c20, 0.35)};
  }
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary.c70};
    outline-offset: 2px;
  }
`;

const TimestampText = styled.p`
  font-size: 12px;
  color: ${p => p.theme.colors.neutral.c70};
  font-weight: 400;
`;

const EmptyRecordsContainer = styled(Flex)`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid ${p => p.theme.colors.neutral.c30};
  border-radius: ${p => `${p.theme.radii[2]}px`};
  font-size: 13px;
  color: ${p => p.theme.colors.neutral.c70};
  font-weight: 400;
  padding: 20px;
  min-height: 150px;
`;

const RecordsLimitDescription = styled.p`
  padding: 10px;
  font-size: 12px;
  color: ${p => p.theme.colors.neutral.c70};
  font-weight: 400;
  text-align: center;
`;

const MAX_RECORDS_DISPLAYED = 10;

const StepRecordPicker = ({ account, transaction, updateTransaction }: StepProps) => {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const formatDate = useDateFormatter(dayFormat);
  const formatHours = useDateFormatter(hourFormat);

  const allUnspentRecords = account.aleoResources?.unspentPrivateRecords ?? [];
  const unspentRecords = useMemo(
    () =>
      [...(account.aleoResources?.unspentPrivateRecords ?? [])]
        .sort((a, b) => new BigNumber(b.microcredits).comparedTo(new BigNumber(a.microcredits)))
        .slice(0, MAX_RECORDS_DISPLAYED),
    [account.aleoResources?.unspentPrivateRecords],
  );

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    locale,
  };

  const selectRecord = (record: AleoUnspentRecord) => {
    updateTransaction(t => {
      if (t.family !== "aleo") return t;

      if (isPublicTransaction(t)) {
        return t;
      }

      return {
        ...t,
        properties: {
          feeRecordCommitment: t.properties?.feeRecordCommitment,
          amountRecordCommitment: record.commitment,
        },
      };
    });
  };

  if (unspentRecords.length === 0) {
    return (
      <Box flow={1}>
        <Alert data-testid="aleo-empty-records-alert" type="warning" mb={4}>
          {t("aleo.shared.recordPicker.noRecordsAlert")}
        </Alert>
        <Label>{t("aleo.shared.recordPicker.label")}</Label>
        <EmptyRecordsContainer>{t("aleo.shared.recordPicker.noRecords")}</EmptyRecordsContainer>
      </Box>
    );
  }

  return (
    <Box flow={1}>
      <Alert data-testid="aleo-pick-records-alert" type="secondary" mb={4}>
        {t("aleo.shared.recordPicker.alert")}
      </Alert>
      <Label>
        {t("aleo.shared.recordPicker.label")}: {allUnspentRecords.length}
      </Label>
      <Flex
        className="scrollbar-custom"
        flexDirection="column"
        rowGap="0.5rem"
        maxHeight="300px"
        overflowY="auto"
      >
        {unspentRecords.map(record => {
          const date = new Date(record.block_timestamp * 1000);
          const isSelected = record.commitment === transaction.properties?.amountRecordCommitment;

          return (
            <StyledButton
              key={record.commitment}
              type="button"
              $checked={isSelected}
              onClick={() => selectRecord(record)}
            >
              {formatCurrencyUnit(unit, new BigNumber(record.microcredits), formatConfig)}
              <TimestampText>
                {formatDate(date)} {formatHours(date)}
              </TimestampText>
            </StyledButton>
          );
        })}
        {allUnspentRecords.length > MAX_RECORDS_DISPLAYED && (
          <RecordsLimitDescription>
            {t("aleo.shared.recordPicker.recordsLimit", { max: MAX_RECORDS_DISPLAYED })}
          </RecordsLimitDescription>
        )}
      </Flex>
    </Box>
  );
};

export default StepRecordPicker;
