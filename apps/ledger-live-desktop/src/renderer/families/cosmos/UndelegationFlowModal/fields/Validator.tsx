import React from "react";
import { useTranslation } from "react-i18next";
import { useCosmosFamilyDelegationsQuerySelector } from "@ledgerhq/live-common/families/cosmos/react";
import { Transaction, CosmosMappedDelegation } from "@ledgerhq/live-common/families/cosmos/types";
import CosmosFamilyLedgerValidatorIcon from "~/renderer/families/cosmos/shared/components/CosmosFamilyLedgerValidatorIcon";
import { Account } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
type Props = {
  account: Account;
  transaction: Transaction;
  onChange: (delegaiton: CosmosMappedDelegation) => void;
};
export default function ValidatorField({ account, transaction, onChange }: Props) {
  const { t } = useTranslation();
  const { query, setQuery, options, value } = useCosmosFamilyDelegationsQuerySelector(
    account,
    transaction,
  );
  return (
    <Box mb={4}>
      <Label>{t("cosmos.undelegation.flow.steps.amount.fields.validator")}</Label>
      <Select
        value={value}
        options={options}
        inputValue={query}
        onInputChange={setQuery}
        renderOption={OptionRow}
        renderValue={OptionRow}
        onChange={onChange}
      />
    </Box>
  );
}
type OptionRowProps = {
  data: CosmosMappedDelegation;
};
function OptionRow({ data: { validatorAddress, validator, formattedAmount } }: OptionRowProps) {
  const name = validator?.name ?? validatorAddress;
  return (
    <Box key={validatorAddress} horizontal alignItems="center" justifyContent="space-between">
      <Box horizontal alignItems="center">
        <CosmosFamilyLedgerValidatorIcon validator={validator} />
        <Text ml={2} ff="Inter|Medium">
          {name}
        </Text>
      </Box>
      <Text ff="Inter|Regular">{formattedAmount}</Text>
    </Box>
  );
}
