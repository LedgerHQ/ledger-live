// @flow
import React, { useCallback, useMemo } from "react";
import { useVotes } from "@ledgerhq/live-common/families/helium/react";
import RadioGroup from "~/renderer/components/RadioGroup";
import type { Transaction } from "@ledgerhq/live-common/families/helium/types";

type Props = {
  transaction: Transaction,
  onChange: (outcomeAddress: string) => void,
};

const VoteRadio = ({ transaction, onChange }: Props) => {
  const votes = useVotes();

  const chosenVote = useMemo(() => {
    if (transaction.model.hipID !== "") {
      return votes.find(v => v.id === transaction.model.hipID);
    } else {
      return votes[0];
    }
  }, [transaction, votes]);

  const indicators = [
    {
      label: chosenVote.outcomes[0].value,
      key: chosenVote.outcomes[0].address,
    },
    {
      label: chosenVote.outcomes[1].value,
      key: chosenVote.outcomes[1].address,
    },
  ];

  const getActiveKey = useCallback(() => {
    if (transaction.model.payee !== "") {
      return chosenVote.outcomes.find(o => o.address === transaction.model.payee).address;
    } else {
      return chosenVote.outcomes[0].address;
    }
  }, [transaction, chosenVote]);

  const onRadioSelected = useCallback(
    (item: { key: string }) => {
      const index = chosenVote.outcomes.findIndex(o => o.address === item.key);
      onChange(item.key, index.toString());
    },
    [onChange],
  );

  return (
    <>
      <RadioGroup items={indicators} activeKey={getActiveKey()} onChange={onRadioSelected} />
    </>
  );
};

export default VoteRadio;
