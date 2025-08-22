import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorRow from "./ValidatorRow";
import { Transaction, MinaAccount } from "@ledgerhq/live-common/families/mina/types";

const ValidatorsContainer = styled(Box)``;

type Props = {
  account: MinaAccount;
  transaction: Transaction;
  onUpdateTransaction: (tx: (t: Transaction) => Transaction) => void;
};

const ValidatorList = ({ account, transaction, onUpdateTransaction }: Props) => {
  const handleValidatorSelect = (address: string) => {
    onUpdateTransaction(tx => ({
      ...tx,
      recipient: address,
      txType: "stake",
    }));
  };

  return (
    <ValidatorsContainer>
      {account.minaResources?.blockProducers.map(validator => (
        <ValidatorRow
          key={validator.address}
          validator={{
            address: validator.address,
            name: validator.identityName,
            delegators: validator.delegations,
            totalStake: validator.stake,
            fee: validator.fee.toString(),
          }}
          selected={transaction?.recipient === validator.address}
          onClick={() => handleValidatorSelect(validator.address)}
        />
      ))}
    </ValidatorsContainer>
  );
};

export default ValidatorList;
