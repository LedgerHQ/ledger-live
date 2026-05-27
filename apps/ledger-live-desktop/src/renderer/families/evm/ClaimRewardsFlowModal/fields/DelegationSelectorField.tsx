import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { useEvmFamilyDelegationsQuerySelector } from "@ledgerhq/live-common/families/evm/staking/react";
import {
  isStakingAccount,
  StakingDelegation,
  StakingMappedDelegation,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { Account } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import invariant from "invariant";
import React from "react";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import DelegateIcon from "~/renderer/icons/Delegate";
import { findDelegationByValidator } from "../utils";

function renderItem({ data }: { data: StakingMappedDelegation }) {
  const name = data.validator?.name ?? data.validatorAddress;
  return (
    <Box key={name} horizontal alignItems="center" justifyContent="space-between">
      <Box horizontal alignItems="center">
        <DelegateIcon size={12} />
        <Text ml={2} ff="Inter|Medium">
          {name}
        </Text>
      </Box>
      <Text ff="Inter|Regular">{data.formattedPendingRewards}</Text>
    </Box>
  );
}

export default function DelegationSelectorField({
  account,
  transaction,
  t,
  onChange,
}: {
  account: Account;
  transaction: GenericTransaction;
  t: TFunction;
  onChange: (t: StakingDelegation | null | undefined) => void;
}) {
  invariant(
    isStakingAccount(account) && account.stakingResources.delegations.length > 0,
    "account with delegations required",
  );
  invariant(transaction && transaction.valAddress, "transaction and validator set required");

  const selectedValidator = findDelegationByValidator(
    transaction.valAddress,
    account.stakingResources.delegations,
  );
  invariant(selectedValidator, "validator must be present in delegations");

  const unit = useAccountUnit(account);
  const { query, setQuery, options, value } = useEvmFamilyDelegationsQuerySelector(
    account,
    transaction,
    unit,
  );

  return (
    <Box flow={1} mt={5}>
      <Label>{t("cosmos.claimRewards.flow.steps.claimRewards.selectLabel")}</Label>
      <Select
        value={value}
        options={options}
        getOptionValue={({ validatorAddress }) => validatorAddress}
        filterOption={({ data }) => data.pendingRewards.gt(0)}
        renderValue={renderItem}
        renderOption={renderItem}
        onInputChange={setQuery}
        inputValue={query}
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
