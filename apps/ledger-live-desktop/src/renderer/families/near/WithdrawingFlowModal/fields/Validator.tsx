import React from "react";
import { useTranslation } from "react-i18next";
import { useNearStakingPositionsQuerySelector } from "@ledgerhq/live-common/families/near/react";
import { Transaction, NearMappedStakingPosition } from "@ledgerhq/live-common/families/near/types";
import { Account } from "@ledgerhq/live-common/types/index";
import LedgerValidatorIcon from "~/renderer/families/near/shared/components/LedgerValidatorIcon";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
type Props = {
  account: Account;
  transaction: Transaction;
  onChange: (stakingPosition: NearMappedStakingPosition) => void;
};
export default function ValidatorField({ account, transaction, onChange }: Props) {
  const { t } = useTranslation();
  const { options, value } = useNearStakingPositionsQuerySelector(account, transaction);
  return (
    <Box mb={4}>
      <Label>{t("near.withdraw.flow.steps.amount.fields.validator")}</Label>
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
  data: NearMappedStakingPosition;
};
function OptionRow({ data: { validatorId, validator, formattedAvailable } }: OptionRowProps) {
  return (
    <Box key={validatorId} horizontal alignItems="center" justifyContent="space-between">
      <Box horizontal alignItems="center">
        <LedgerValidatorIcon validator={validator} />
        <Text ml={2} ff="Inter|Medium">
          {validatorId}
        </Text>
      </Box>
      <Text ff="Inter|Regular">{formattedAvailable}</Text>
    </Box>
  );
}
