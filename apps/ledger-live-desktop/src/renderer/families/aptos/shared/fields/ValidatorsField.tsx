import { useValidators } from "@ledgerhq/live-common/families/aptos/react";
import { AptosAccount, Validator } from "@ledgerhq/live-common/families/aptos/types";
import React, { useState, useEffect, useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorRow from "../components/ValidatorRow";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = {
  account: AptosAccount;
  chosenValidatorAddr: string | undefined | null;
  onChangeValidator: (v: { address: string }) => void;
};

const ValidatorField = ({ account, onChangeValidator, chosenValidatorAddr }: Props) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [currentValidator, setCurrentValidator] = useState<Validator | null>(null);

  const unit = useAccountUnit(account);
  const validators = useValidators(account.currency, search);

  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value),
    [setSearch],
  );

  useEffect(() => {
    const selected = validators.find(v => v.accountAddr === chosenValidatorAddr) || null;
    setCurrentValidator(selected);
  }, [chosenValidatorAddr, validators]);
  /* 
  useEffect(() => {
    const selectedValidatorAddr = validators.find(p => p.accountAddr === chosenValidatorAddr);
    if (selectedValidatorAddr) {
      const isDefault = validators.slice(0, 2).includes(selectedValidatorAddr);
      if (isDefault) {
        setCurrentValidator([selectedValidatorAddr]);
      }
      setCurrentValidator([
        selectedValidatorAddr,
        ...validators.slice(0, 2).filter(v => v !== selectedValidatorAddr),
      ]);
    }
    console.log("-------> current validator ", currentValidator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenValidatorAddr]);
  */

  const renderItem = (validator: Validator) => {
    return (
      <ValidatorRow
        key={validator.accountAddr}
        validator={validator}
        currency={account.currency}
        active={chosenValidatorAddr === validator.accountAddr}
        onClick={onChangeValidator}
        unit={unit}
      />
    );
  };

  const displayedValidators = showAll
    ? validators
    : currentValidator
      ? [currentValidator]
      : validators.slice(0, 2);

  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1} data-testid="validator-list">
          <ScrollLoadingList
            data={displayedValidators}
            style={{
              flex: showAll ? "1 0 240px" : "1 0 126px",
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
