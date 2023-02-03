// @flow
import React, { useState, useCallback } from "react";
import type { TFunction } from "react-i18next";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import { Trans } from "react-i18next";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorRow from "../components/ValidatorRow";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { Account, TransactionStatus } from "@ledgerhq/live-common/types";
import { useAvalancheFilteredValidators } from "@ledgerhq/live-common/families/avalanchepchain/react";
import type { AvalanchePChainValidator } from "@ledgerhq/live-common/families/avalanchepchain/types";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";

type Props = {
  t: TFunction,
  account: Account,
  status: TransactionStatus,
  onChangeValidator: ({ address: string, endTime: string }) => void,
  chosenVoteAccAddr: string,
};

const ValidatorField = ({ account, status, t, onChangeValidator, chosenVoteAccAddr }: Props) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const unit = getAccountUnit(account);
  const validators = useAvalancheFilteredValidators(search);
  const onSearch = useCallback(e => setSearch(e.target.value), [setSearch]);

  const renderItem = useCallback(
    (validator: AvalanchePChainValidator) => {
      return (
        <ValidatorRow
          currency={account.currency}
          key={validator.nodeID}
          validator={validator}
          unit={unit}
          active={chosenVoteAccAddr === validator.nodeID}
          onClick={onChangeValidator}
        ></ValidatorRow>
      );
    },
    [account, unit, chosenVoteAccAddr, onChangeValidator],
  );

  if (!status) return null;

  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1}>
          <ScrollLoadingList
            data={
              showAll
                ? validators
                : [validators.find(v => v.nodeID === chosenVoteAccAddr) || validators[0]]
            }
            style={{ flex: showAll ? "1 0 256px" : "1 0 64px", marginBottom: 0, paddingLeft: 0 }}
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

const SeeAllButton: ThemedComponent<{ expanded: boolean }> = styled.div`
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
