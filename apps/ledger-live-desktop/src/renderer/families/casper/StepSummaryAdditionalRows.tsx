import React from "react";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/families/casper/types";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import { useFeature } from "@features/platform-feature-flags";

type Props = {
  transaction: Transaction;
};

const StepSummaryAdditionalRows = ({ transaction }: Props) => {
  const lldMemoTag = useFeature("lldMemoTag");

  // When lldMemoTag is enabled the generic memo section in StepSummary already shows
  // the value via getMemoTagValueByTransactionFamily → memoValue, so skip here.
  if (lldMemoTag?.enabled) return null;

  const transferId = transaction.memoValue;
  if (!transferId) return null;

  return (
    <Box horizontal justifyContent="space-between" alignItems="center" mt={10}>
      <Text ff="Inter|Medium" color="neutral.c60" fontSize={4}>
        <Trans i18nKey="families.casper.transferId" />
      </Text>
      <Text ff="Inter|SemiBold" color="neutral.c100" fontSize={4}>
        {transferId}
      </Text>
    </Box>
  );
};

export default StepSummaryAdditionalRows;
