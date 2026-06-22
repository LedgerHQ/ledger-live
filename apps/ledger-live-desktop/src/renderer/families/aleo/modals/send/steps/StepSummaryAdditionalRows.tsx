import React from "react";
import { useTranslation } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import {
  getEstimatedSigningTime,
  isPublicTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import Label from "~/renderer/components/Label";
import Ellipsis from "~/renderer/components/Ellipsis";
import Box from "~/renderer/components/Box";
import type { BoxProps } from "~/renderer/components/Box/Box";
import type { AleoFamily } from "../../../types";
import { getAleoCurrencyConfig, isAleoTransaction } from "../../../shared/utils";

type StepSummaryAdditionalRowProps = BoxProps & {
  label: React.ReactNode;
  value: React.ReactNode;
};

const StepSummaryAdditionalRow = ({ label, value, ...boxProps }: StepSummaryAdditionalRowProps) => (
  <Box horizontal justifyContent="space-between" mb={2} {...boxProps}>
    <Label color="neutral.c60">{label}</Label>
    <Ellipsis ff="Inter" color="neutral.c80" fontSize={4} fontWeight={500}>
      {value}
    </Ellipsis>
  </Box>
);

const StepSummaryAdditionalRows: NonNullable<AleoFamily["StepSummaryAdditionalRows"]> = ({
  account,
  parentAccount,
  transaction,
}) => {
  const { t } = useTranslation();

  const mainAccount = getMainAccount(account, parentAccount);
  const currencyConfig = getAleoCurrencyConfig(mainAccount.currency);
  const isAutoPickingStrategy = currencyConfig?.recordPickingStrategy === "auto";
  if (
    !isAutoPickingStrategy ||
    !isAleoTransaction(transaction) ||
    isPublicTransaction(transaction) ||
    !transaction.properties
  ) {
    return null;
  }

  const amountRecordCount = transaction.properties.amountRecordCommitments.length;
  const feeRecordCount = transaction.properties.feeRecordCommitment ? 1 : 0;
  const totalRecordCount = amountRecordCount + feeRecordCount;

  const signingTime = getEstimatedSigningTime(
    totalRecordCount,
    t("time.second_short"),
    t("time.minute_short"),
  );

  return (
    <>
      <StepSummaryAdditionalRow
        label={t("aleo.send.summary.recordsUsed")}
        value={totalRecordCount}
        mt={2}
      />
      <StepSummaryAdditionalRow label={t("aleo.send.summary.signingTime")} value={signingTime} />
    </>
  );
};

export default StepSummaryAdditionalRows;
