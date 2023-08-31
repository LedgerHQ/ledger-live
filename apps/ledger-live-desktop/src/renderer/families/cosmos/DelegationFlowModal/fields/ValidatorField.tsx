import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
import {
  CosmosDelegation,
  CosmosValidatorItem,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import { Account } from "@ledgerhq/types-live";
import React, { useCallback, useMemo, useState } from "react";
import { TFunction } from "i18next";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import ValidatorRow from "~/renderer/families/cosmos/shared/components/CosmosFamilyValidatorRow";
import IconAngleDown from "~/renderer/icons/AngleDown";
type Props = {
  t: TFunction;
  account: Account;
  status: TransactionStatus;
  delegations: CosmosDelegation[];
  onChangeValidator: (a: { address: string }) => void;
  chosenVoteAccAddr: string;
};
const ValidatorField = ({ account, onChangeValidator, chosenVoteAccAddr }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const unit = getAccountUnit(account);
  const currencyId = account.currency.id;
  const validators = useLedgerFirstShuffledValidatorsCosmosFamily(currencyId, search);
  const onSearch = useCallback(evt => setSearch(evt.target.value), [setSearch]);
  const chosenValidator = useMemo(() => {
    return [validators.find(v => v.validatorAddress === chosenVoteAccAddr) || validators[0]];
  }, [validators, chosenVoteAccAddr]);

  if (chosenVoteAccAddr === "") {
    onChangeValidator({ address: validators[0].validatorAddress });
  }

  const renderItem = (validator: CosmosValidatorItem) => {
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
const ValidatorsFieldContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
`;
const SeeAllButton = styled.div<{
  expanded: boolean;
}>`
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
