import React from "react";
import { useCosmosFamilyDelegationsQuerySelector } from "@ledgerhq/live-common/families/cosmos/react";
import { CosmosMappedDelegation } from "@ledgerhq/live-common/families/cosmos/types";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import CosmosFamilyLedgerValidatorIcon from "~/renderer/families/cosmos/shared/components/CosmosFamilyLedgerValidatorIcon";
const renderItem = ({
  data: { validatorAddress, validator, formattedPendingRewards, status },
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
      <Text ff="Inter|Regular">{formattedPendingRewards}</Text>
    </Box>
  );
};
export default function DelegationSelectorField({ account, transaction, t, onChange }: any) {
  const { query, setQuery, options, value } = useCosmosFamilyDelegationsQuerySelector(
    account,
    transaction,
  );
  return (
    <Box flow={1} mt={5}>
      <Label>{t("cosmos.claimRewards.flow.steps.claimRewards.selectLabel")}</Label>
      <Select
        value={value}
        options={options}
        getOptionValue={({ validatorAddress }) => validatorAddress}
        renderValue={renderItem}
        renderOption={renderItem}
        onInputChange={setQuery}
        inputValue={query}
        filterOption={({ data }) => data.pendingRewards.gt(0)}
        placeholder={t("common.selectAccount")}
        noOptionsMessage={({ inputValue }) =>
          t("common.selectValidatorNoOption", {
            accountName: inputValue,
          })
        }
        onChange={onChange}
      />
    </Box>
  );
}
