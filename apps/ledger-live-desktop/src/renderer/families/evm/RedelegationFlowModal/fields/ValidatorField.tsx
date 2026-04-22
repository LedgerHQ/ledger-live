import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import type {
  StakingAccount,
  StakingValidatorItem,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { useEvmStakingValidators } from "@ledgerhq/live-common/families/evm/staking/react";
import Box from "~/renderer/components/Box";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import EvmFamilyValidatorRow from "~/renderer/families/evm/shared/components/EvmFamilyValidatorRow";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = Readonly<{
  account: StakingAccount;
  onChangeValidator: (address: string) => void;
  chosenVoteAccAddr: string;
  excludeAddress?: string;
}>;

export default function ValidatorField({
  account,
  onChangeValidator,
  chosenVoteAccAddr,
  excludeAddress,
}: Props) {
  const [search, setSearch] = useState("");
  const unit = useAccountUnit(account);
  const currencyId = account.currency.id;

  const { validators, loading, error } = useEvmStakingValidators(currencyId, search);

  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value),
    [],
  );

  const onChange = useCallback(
    ({ address }: { address: string }) => onChangeValidator(address),
    [onChangeValidator],
  );

  const filteredValidators = useMemo(
    () => validators.filter(v => v.validatorAddress !== excludeAddress),
    [validators, excludeAddress],
  );

  const renderItem = (validator: StakingValidatorItem) => (
    <EvmFamilyValidatorRow
      key={validator.validatorAddress}
      currency={account.currency}
      validator={validator}
      unit={unit}
      active={chosenVoteAccAddr === validator.validatorAddress}
      onClick={onChange}
    />
  );

  return (
    <>
      {error && <ErrorBanner error={error} />}
      <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />
      <ScrollLoadingList
        data={filteredValidators}
        style={{ flex: "1 0 350px" }}
        renderItem={renderItem}
        noResultPlaceholder={
          loading || error ? null : (
            <Box p={4} alignItems="center">
              <Text ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
                <Trans i18nKey="ethereum.evmStaking.delegation.flow.steps.validator.noResults" />
              </Text>
            </Box>
          )
        }
      />
    </>
  );
}
