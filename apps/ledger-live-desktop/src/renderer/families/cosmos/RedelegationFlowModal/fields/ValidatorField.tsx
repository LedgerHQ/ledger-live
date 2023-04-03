import invariant from "invariant";
import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import { Trans } from "react-i18next";
import Text from "~/renderer/components/Text";
import ValidatorRow from "~/renderer/families/cosmos/shared/components/CosmosFamilyValidatorRow";
const ValidatorsSection: ThemedComponent<{}> = styled(Box)`
  width: 100%;
  height: 100%;
  padding-bottom: ${p => p.theme.space[6]}px;
`;
export default function ValidatorField({ account, transaction, t, onChange }: any) {
  const currencyName = account.currency.name.toLowerCase();
  const [search, setSearch] = useState("");
  const validators = useLedgerFirstShuffledValidatorsCosmosFamily(currencyName, search);
  const { cosmosResources } = account;
  const onSearch = useCallback(evt => setSearch(evt.target.value), [setSearch]);
  invariant(cosmosResources, "cosmosResources required");
  const unit = getAccountUnit(account);
  const fromValidatorAddress = transaction.sourceValidator;
  const sortedFilteredValidators = validators.filter(
    v => v.validatorAddress !== fromValidatorAddress,
  );
  const renderItem = validator => {
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
