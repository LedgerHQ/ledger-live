// @flow
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import type { Account, TransactionStatus } from "@ledgerhq/live-common/types/index";
import type { Transaction } from "@ledgerhq/live-common/families/helium/types";
import invariant from "invariant";
import React, { useEffect, useRef, useState, useMemo } from "react";
import type { TFunction } from "react-i18next";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import IconAngleDown from "~/renderer/icons/AngleDown";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import HipRow from "../components/HIPRow";

type Props = {
  t: TFunction,
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
  onChangeVote: (vote: any) => void,
  votes: any[],
};

const HIPField = ({ t, account, status, onChangeVote, transaction, votes }: Props) => {
  invariant(account && account.heliumResources, "helium account and resources required");

  const [showAll, setShowAll] = useState(false);

  const unit = getAccountUnit(account);

  const containerRef = useRef();

  const chosenVote = useMemo(() => {
    if (transaction.model.hipID !== "") {
      return votes.find(v => v.id === transaction.model.hipID);
    } else if (votes.length > 0) {
      return votes[0];
    }
  }, [transaction, votes]);

  /** auto focus first input on mount */
  useEffect(() => {
    if (containerRef && containerRef.current && containerRef.current.querySelector) {
      const firstInput = containerRef.current.querySelector("input");
      if (firstInput && firstInput.focus) firstInput.focus();
    }
  }, []);

  const renderItem = (vote: any) => {
    if (!vote)
      return (
        <Box flow={1} justifyContent="center" horizontal alignItems="center" mt={20}>
          <Text>{"No open votes."}</Text>{" "}
        </Box>
      );
    return (
      <HipRow
        active={showAll && chosenVote === vote}
        onClick={() => onChangeVote(vote)}
        key={vote ? vote.id : "helium-no-open-votes-id"}
        vote={vote}
        unit={unit}
      ></HipRow>
    );
  };

  return (
    <ValidatorsFieldContainer>
      <Box p={1}>
        <ScrollLoadingList
          data={showAll ? votes : [chosenVote]}
          style={{ flex: showAll ? "1 0 300px" : "1 0 63px", marginBottom: 0, paddingLeft: 0 }}
          renderItem={renderItem}
        />
      </Box>
      {votes.length > 0 ? (
        <SeeAllButton expanded={showAll} onClick={() => setShowAll(shown => !shown)}>
          <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
          </Text>
          <IconAngleDown size={16} />
        </SeeAllButton>
      ) : null}
    </ValidatorsFieldContainer>
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

export default HIPField;
