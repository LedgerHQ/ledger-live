import React from "react";
import { useTranslation } from "react-i18next";
import { useAptosStakingPositionsQuerySelector } from "@ledgerhq/live-common/families/aptos/react";
import {
  Transaction,
  AptosMappedStakingPosition,
  AptosAccount,
} from "@ledgerhq/live-common/families/aptos/types";
import ValidatorIcon from "~/renderer/families/aptos/shared/components/ValidatorIcon";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";

type Props = {
  account: AptosAccount;
  transaction: Transaction;
  onChange: (stakingPosition?: AptosMappedStakingPosition | null) => void;
};

export default function ValidatorField({ account, transaction, onChange }: Readonly<Props>) {
  const { t } = useTranslation();
  const { options, value } = useAptosStakingPositionsQuerySelector(account, transaction);

  return (
    <Box mb={4}>
      <Label>{t("aptos.withdraw.flow.steps.amount.fields.validator")}</Label>
      <Select
        value={value}
        options={options}
        renderOption={OptionRow}
        renderValue={OptionRow}
        onChange={onChange}
        isSearchable={false}
      />
    </Box>
  );
}

type OptionRowProps = {
  data: AptosMappedStakingPosition;
};

function OptionRow({
  data: { validatorId, validator, formattedAvailable },
}: Readonly<OptionRowProps>) {
  return (
    <Box key={validatorId} horizontal alignItems="center" justifyContent="space-between">
      <Box horizontal alignItems="center">
        <ValidatorIcon validatorAddress={validator?.address} />
        <Text ml={2} ff="Inter|Medium">
          {validatorId}
        </Text>
      </Box>
      <Text ff="Inter|Regular">{formattedAvailable}</Text>
    </Box>
  );
}
