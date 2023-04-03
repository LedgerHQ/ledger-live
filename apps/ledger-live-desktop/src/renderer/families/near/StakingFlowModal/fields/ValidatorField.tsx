import React, { useState, useCallback } from "react";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useLedgerFirstShuffledValidatorsNear } from "@ledgerhq/live-common/families/near/react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import { Trans } from "react-i18next";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorRow from "~/renderer/families/near/shared/components/ValidatorRow";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { Account } from "@ledgerhq/live-common/types/index";
import { NearValidatorItem } from "@ledgerhq/live-common/families/near/types";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/near/logic";
type Props = {
  account: Account;
  onChangeValidator: (a: { address: string }) => void;
  chosenVoteAccAddr: string;
  validators?: NearValidatorItem;
};
const ValidatorField = ({ account, onChangeValidator, chosenVoteAccAddr }: Props) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const unit = getAccountUnit(account);
  const validators = useLedgerFirstShuffledValidatorsNear(search);
  const renderItem = (validator: NearValidatorItem) => {
    return (
      <ValidatorRow
        currency={account.currency}
        key={validator.validatorAddress}
        validator={validator}
        unit={unit}
        active={chosenVoteAccAddr === validator.validatorAddress}
        onClick={onChangeValidator}
      />
    );
  };
  const onSearch = useCallback(evt => setSearch(evt.target.value), [setSearch]);
  if (!chosenVoteAccAddr && validators[0].validatorAddress === FIGMENT_NEAR_VALIDATOR_ADDRESS) {
    onChangeValidator({
      address: FIGMENT_NEAR_VALIDATOR_ADDRESS,
    });
  }
  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1}>
          <ScrollLoadingList
            data={
              showAll
                ? validators
                : [validators.find(v => v.validatorAddress === chosenVoteAccAddr) || validators[0]]
            }
            style={{
              flex: showAll ? "1 0 256px" : "1 0 64px",
              marginBottom: 0,
              paddingLeft: 0,
            }}
            renderItem={renderItem}
            noResultPlaceholder={
              validators.length <= 0 && search.length > 0 && <NoResultPlaceholder search={search} />
            }
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
