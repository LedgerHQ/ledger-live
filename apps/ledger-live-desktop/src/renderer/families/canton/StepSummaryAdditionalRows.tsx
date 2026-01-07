import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { Transaction } from "@ledgerhq/live-common/families/canton/types";
import { DurationEnum } from "@ledgerhq/coin-canton/types";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";

const secondsToDuration: Record<number, DurationEnum> = {
  [3 * 60 * 60]: DurationEnum.THREE_HOURS,
  [6 * 60 * 60]: DurationEnum.SIX_HOURS,
  [24 * 60 * 60]: DurationEnum.ONE_DAY,
  [7 * 24 * 60 * 60]: DurationEnum.ONE_WEEK,
  [30 * 24 * 60 * 60]: DurationEnum.ONE_MONTH,
};

const durationToTranslationKey: Record<DurationEnum, string> = {
  [DurationEnum.THREE_HOURS]: "families.canton.expiryDuration.threeHours",
  [DurationEnum.SIX_HOURS]: "families.canton.expiryDuration.sixHours",
  [DurationEnum.ONE_DAY]: "families.canton.expiryDuration.oneDay",
  [DurationEnum.ONE_WEEK]: "families.canton.expiryDuration.oneWeek",
  [DurationEnum.ONE_MONTH]: "families.canton.expiryDuration.oneMonth",
};

type Props = {
  account: Account | TokenAccount;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
};

const StepSummaryAdditionalRows = ({ transaction }: Props) => {
  const expiryDurationLabel = useMemo(() => {
    const seconds = transaction.expireInSeconds;
    if (seconds === undefined) {
      return durationToTranslationKey[DurationEnum.ONE_DAY];
    }
    const duration = secondsToDuration[seconds];
    return duration
      ? durationToTranslationKey[duration]
      : durationToTranslationKey[DurationEnum.ONE_DAY];
  }, [transaction.expireInSeconds]);

  return (
    <Box horizontal justifyContent="space-between" alignItems="center" mt={10} mb={20}>
      <Text ff="Inter|Medium" color="neutral.c60" fontSize={4}>
        <Trans i18nKey="families.canton.expiryDuration.summaryLabel" />
      </Text>
      <Text ff="Inter|SemiBold" color="neutral.c100" fontSize={4}>
        <Trans i18nKey={expiryDurationLabel} />
      </Text>
    </Box>
  );
};

export default StepSummaryAdditionalRows;
