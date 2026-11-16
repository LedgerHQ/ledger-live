import React, { useCallback } from "react";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useCosmosDelegationsQuerySelector } from "~/renderer/families/cosmos/shared/hooks/useCosmosMappedDelegations";
import {
  CosmosAccount,
  CosmosMappedDelegation,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import CosmosFamilyLedgerValidatorIcon from "~/renderer/families/cosmos/shared/components/CosmosFamilyLedgerValidatorIcon";
import { TFunction } from "i18next";
const Item = ({
  data: { validatorAddress, validator, formattedPendingRewards },
  currency,
}: {
  data: CosmosMappedDelegation;
  currency: CryptoCurrency;
}) => {
  const name = validator?.name ?? validatorAddress;
  return (
    <Box key={validatorAddress} horizontal alignItems="center" justifyContent="space-between">
      <Box horizontal alignItems="center">
        <CosmosFamilyLedgerValidatorIcon currency={currency} validator={validator} />
        <Text ml={2} ff="Inter|Medium">
          {name}
        </Text>
      </Box>
      <Text ff="Inter|Regular">{formattedPendingRewards}</Text>
    </Box>
  );
};
export default function DelegationSelectorField({
  account,
  transaction,
  t,
  onChange,
}: {
  account: CosmosAccount;
  transaction: Transaction;
  t: TFunction;
  onChange: (t: CosmosMappedDelegation | null | undefined) => void;
}) {
  const { query, setQuery, options, value } = useCosmosDelegationsQuerySelector(
    account,
    transaction,
  );
  const renderItem = useCallback(
    ({ data }: { data: CosmosMappedDelegation }) => (
      <Item data={data} currency={account.currency} />
    ),
    [account.currency],
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
