import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
  StakingAccount,
  StakingMappedDelegation,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { mapDelegations } from "@ledgerhq/live-common/families/evm/staking/logic";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-alpaca/types";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import EvmValidatorIcon from "~/renderer/families/evm/shared/components/EvmValidatorIcon";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const renderItem = ({
  data: { validatorAddress, validator, formattedAmount },
}: {
  data: StakingMappedDelegation;
}) => {
  const name = validator?.name ?? validatorAddress;
  return (
    <Box key={validatorAddress} horizontal alignItems="center" justifyContent="space-between">
      <Box horizontal alignItems="center">
        <EvmValidatorIcon validator={validator ?? { validatorAddress, name: validatorAddress }} />
        <Text ml={2} ff="Inter|Medium">
          {name}
        </Text>
      </Box>
      <Text ff="Inter|Regular">{formattedAmount}</Text>
    </Box>
  );
};

type Props = {
  account: StakingAccount;
  transaction: GenericTransaction;
  onChange: (delegation?: StakingMappedDelegation | null) => void;
};

export default function RedelegationSelectorField({ account, transaction, onChange }: Props) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const validators = account.stakingResources.validators ?? [];

  const options = useMemo(
    () => mapDelegations(account.stakingResources.delegations, validators, unit),
    [account.stakingResources.delegations, unit],
  );

  const value = useMemo(
    () => options.find(o => o.validatorAddress === transaction.valAddress) ?? null,
    [options, transaction.valAddress],
  );

  return (
    <Box flow={1} pb={5}>
      <Label>{t("ethereum.evmStaking.redelegation.flow.steps.validators.currentDelegation")}</Label>
      <Select
        value={value}
        options={options}
        getOptionValue={({ validatorAddress }: StakingMappedDelegation) => validatorAddress}
        renderValue={renderItem}
        renderOption={renderItem}
        isDisabled={options.length <= 1}
        placeholder={t("common.selectAccount")}
        noOptionsMessage={({ inputValue }: { inputValue: string }) =>
          t("common.selectAccountNoOption", { accountName: inputValue })
        }
        onChange={onChange}
      />
    </Box>
  );
}
