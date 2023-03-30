import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useValidators } from "@ledgerhq/live-common/families/solana/react";
import { ValidatorAppValidator } from "@ledgerhq/live-common/families/solana/validator-app";
import { Account } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import invariant from "invariant";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { TFunction, Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import IconAngleDown from "~/renderer/icons/AngleDown";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import ValidatorRow from "../components/ValidatorRow";
type Props = {
  t: TFunction;
  account: Account;
  status: TransactionStatus;
  chosenVoteAccAddr: string | undefined | null;
  onChangeValidator: (v: ValidatorAppValidator) => void;
};
const ValidatorField = ({ t, account, onChangeValidator, chosenVoteAccAddr, status }: Props) => {
  invariant(account && account.solanaResources, "solana account and resources required");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const unit = getAccountUnit(account);
  const validators = useValidators(account.currency, search);
  const chosenValidator = useMemo(() => {
    if (chosenVoteAccAddr !== null) {
      return validators.find(v => v.voteAccount === chosenVoteAccAddr);
    }
  }, [validators, chosenVoteAccAddr]);
  const containerRef = useRef();

  /** auto focus first input on mount */
  useEffect(() => {
    if (containerRef && containerRef.current && containerRef.current.querySelector) {
      const firstInput = containerRef.current.querySelector("input");
      if (firstInput && firstInput.focus) firstInput.focus();
    }
  }, []);
  const onSearch = useCallback(evt => setSearch(evt.target.value), [setSearch]);
  const renderItem = (validator: ValidatorAppValidator, validatorIdx: number) => {
    return (
      <ValidatorRow
        currency={account.currency}
        active={chosenVoteAccAddr === validator.voteAccount}
        onClick={onChangeValidator}
        key={validator.voteAccount}
        validator={validator}
        unit={unit}
      ></ValidatorRow>
    );
  };
  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1}>
          <ScrollLoadingList
            data={showAll ? validators : [chosenValidator ?? validators[0]]}
            style={{
              flex: showAll ? "1 0 240px" : "1 0 63px",
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
