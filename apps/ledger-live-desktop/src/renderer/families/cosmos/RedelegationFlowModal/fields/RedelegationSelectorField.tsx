import React from "react";
import { useTranslation } from "react-i18next";
import { useCosmosFamilyDelegationsQuerySelector } from "@ledgerhq/live-common/families/cosmos/react";
import { CosmosMappedDelegation, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { Account } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import CosmosFamilyLedgerValidatorIcon from "~/renderer/families/cosmos/shared/components/CosmosFamilyLedgerValidatorIcon";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
const renderItem = ({
  data: { validatorAddress, validator, formattedAmount, status },
}: {
  data: CosmosMappedDelegation;
}) => {
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
};
type RedelegationSelectorFieldProps = {
  account: Account;
  transaction: Transaction;
  onChange: (delegation: CosmosMappedDelegation) => void;
};
export default function RedelegationSelectorField({
  account,
  transaction,
  onChange,
}: RedelegationSelectorFieldProps) {
  const { t } = useTranslation();
  const { query, setQuery, options, value } = useCosmosFamilyDelegationsQuerySelector(
    account,
    transaction,
  );
  return (
    <Box flow={1} pb={5}>
      <Label>{t("cosmos.redelegation.flow.steps.validators.currentDelegation")}</Label>
      <Select
        value={value}
        options={options}
        getOptionValue={({ address }) => address}
        renderValue={renderItem}
        renderOption={renderItem}
        onInputChange={setQuery}
        inputValue={query}
        filterOption={false}
        isDisabled={options.length <= 1}
        placeholder={t("common.selectAccount")}
        noOptionsMessage={({ inputValue }) =>
          t("common.selectAccountNoOption", {
            accountName: inputValue,
          })
        }
        onChange={onChange}
      />
    </Box>
  );
}
