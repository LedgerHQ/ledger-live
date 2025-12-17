import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/canton/types";
import { DurationEnum } from "@ledgerhq/coin-canton/types";
import { Account } from "@ledgerhq/types-live";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";

type DurationOption = {
  value: DurationEnum;
  label: string;
  seconds: number;
};

const durationToSeconds: Record<DurationEnum, number> = {
  [DurationEnum.THREE_HOURS]: 3 * 60 * 60,
  [DurationEnum.SIX_HOURS]: 6 * 60 * 60,
  [DurationEnum.ONE_DAY]: 24 * 60 * 60,
  [DurationEnum.ONE_WEEK]: 7 * 24 * 60 * 60,
  [DurationEnum.ONE_MONTH]: 30 * 24 * 60 * 60,
};

const ExpiryDurationField = ({
  onChange,
  account,
  transaction,
}: {
  onChange: (t: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
}) => {
  const { t } = useTranslation();
  const bridge = getAccountBridge(account);

  const options: DurationOption[] = useMemo(
    () => [
      {
        value: DurationEnum.THREE_HOURS,
        label: t("families.canton.expiryDuration.threeHours"),
        seconds: durationToSeconds[DurationEnum.THREE_HOURS],
      },
      {
        value: DurationEnum.SIX_HOURS,
        label: t("families.canton.expiryDuration.sixHours"),
        seconds: durationToSeconds[DurationEnum.SIX_HOURS],
      },
      {
        value: DurationEnum.ONE_DAY,
        label: t("families.canton.expiryDuration.oneDay"),
        seconds: durationToSeconds[DurationEnum.ONE_DAY],
      },
      {
        value: DurationEnum.ONE_WEEK,
        label: t("families.canton.expiryDuration.oneWeek"),
        seconds: durationToSeconds[DurationEnum.ONE_WEEK],
      },
      {
        value: DurationEnum.ONE_MONTH,
        label: t("families.canton.expiryDuration.oneMonth"),
        seconds: durationToSeconds[DurationEnum.ONE_MONTH],
      },
    ],
    [t],
  );

  const selectedOption = useMemo(() => {
    const currentSeconds = transaction.expireInSeconds;
    return options.find(opt => opt.seconds === currentSeconds) ?? options[2]; // Default to ONE_DAY
  }, [options, transaction.expireInSeconds]);

  const onExpiryDurationChange = useCallback(
    (option?: DurationOption | null) => {
      if (option) {
        onChange(
          bridge.updateTransaction(transaction, {
            expireInSeconds: option.seconds,
          }),
        );
      }
    },
    [onChange, bridge, transaction],
  );

  return (
    <Box flow={1}>
      <Label>{t("families.canton.expiryDuration.label")}</Label>
      <Select
        isSearchable={false}
        onChange={onExpiryDurationChange}
        value={selectedOption}
        options={options}
        renderOption={({ data }) => data.label}
        renderValue={({ data }) => data.label}
      />
    </Box>
  );
};

export default ExpiryDurationField;
