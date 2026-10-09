import { getValAddress } from "@ledgerhq/live-common/families/cosmos/buildTransaction";
import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
import type {
  CosmosAccount,
  CosmosValidatorItem,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { isStakingAccount } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import ValidatorRow from "~/renderer/families/cosmos/shared/components/CosmosFamilyValidatorRow";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const ValidatorsSection = styled(Box)`
  width: 100%;
  height: 100%;
  padding-bottom: ${p => p.theme.space[6]}px;
`;
export default function ValidatorField({
  account,
  transaction,
  onChange,
}: {
  account: CosmosAccount;
  transaction: Transaction;
  onChange: (a: { address: string }) => void;
}) {
  invariant(isStakingAccount(account), "cosmos staking account required");

  const currencyId = account.currency.id.toLowerCase();
  const [search, setSearch] = useState("");
  const validators = useLedgerFirstShuffledValidatorsCosmosFamily(currencyId, account.stakingResources.validators, search);
  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value),
    [setSearch],
  );
  const unit = useAccountUnit(account);
  const fromValidatorAddress = getValAddress(transaction);
  const sortedFilteredValidators = validators.filter(
    v => v.validatorAddress !== fromValidatorAddress,
  );
  const renderItem = (validator: CosmosValidatorItem) => {
    return (
      <ValidatorRow
        currency={account.currency}
        key={validator.validatorAddress}
        validator={validator}
        unit={unit}
        onClick={onChange}
      />
    );
  };
  return (
    <ValidatorsSection>
      <Box horizontal alignItems="center" justifyContent="space-between" py={2} px={3}>
        <Text fontSize={3} ff="Inter|Medium">
          <Trans
            i18nKey="vote.steps.castVotes.validators"
            values={{
              total: sortedFilteredValidators.length,
            }}
          />
        </Text>
      </Box>
      <Box mb={2}>
        <ValidatorSearchInput search={search} onSearch={onSearch} />
      </Box>
      <ScrollLoadingList
        data={sortedFilteredValidators}
        style={{
          flex: "1 0 350px",
        }}
        renderItem={renderItem}
      />
    </ValidatorsSection>
  );
}
