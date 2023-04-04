import React, { useState, useCallback, useMemo } from "react";
import { TFunction, Trans } from "react-i18next";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorRow from "~/renderer/families/cosmos/shared/components/CosmosFamilyValidatorRow";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { Account } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { CosmosDelegation, CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
type Props = {
  t: TFunction;
  account: Account;
  status: TransactionStatus;
  delegations: CosmosDelegation[];
  onChangeValidator: (a: { address: string }) => void;
  chosenVoteAccAddr: string;
};
const ValidatorField = ({
  account,
  status,
  t,
  delegations,
  onChangeValidator,
  chosenVoteAccAddr,
}: Props) => {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const unit = getAccountUnit(account);
  const currencyName = account.currency.name.toLowerCase();
  const validators = useLedgerFirstShuffledValidatorsCosmosFamily(currencyName, search);
  const onSearch = useCallback(evt => setSearch(evt.target.value), [setSearch]);
  const chosenValidator = useMemo(() => {
    return [validators.find(v => v.validatorAddress === chosenVoteAccAddr) || validators[0]];
  }, [validators, chosenVoteAccAddr]);
  const renderItem = (validator: CosmosValidatorItem, validatorIdx: number) => {
    return (
      <ValidatorRow
        currency={account.currency}
        key={validator.validatorAddress}
        validator={validator}
        unit={unit}
        active={chosenVoteAccAddr === validator.validatorAddress}
        onClick={onChangeValidator}
      ></ValidatorRow>
    );
  };
  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1}>
          <ScrollLoadingList
            data={showAll ? validators : chosenValidator}
            style={{
              flex: showAll ? "1 0 256px" : "1 0 64px",
              marginBottom: 0,
              paddingLeft: 0,
            }}
            renderItem={renderItem}
            noResultPlaceholder={null}
          />
        </Box>
        <SeeAllButton expanded={showAll} onClick={() => setShowAll(shown => !shown)}>
          <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
          </Text>
          <IconAngleDown size={16} />
        </SeeAllButton>
      </ValidatorsFieldContainer>
    </>
  );
};
const ValidatorsFieldContainer: ThemedComponent<{}> = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
`;
const SeeAllButton: ThemedComponent<{
  expanded: boolean;
}> = styled.div`
  display: flex;
  color: ${p => p.theme.colors.wallet};
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${p => p.theme.colors.palette.divider};
  height: 40px;
  cursor: pointer;

  &:hover ${Text} {
    text-decoration: underline;
  }

  > :nth-child(2) {
    margin-left: 8px;
    transform: rotate(${p => (p.expanded ? "180deg" : "0deg")});
  }
`;
export default ValidatorField;
