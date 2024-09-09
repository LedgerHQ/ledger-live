import React from "react";
import { Account } from "@ledgerhq/types-live";
import Inscriptions from "../../components/Inscriptions";
import RareSats from "../../components/RareSats";
import { Flex } from "@ledgerhq/react-ui";

type Props = {
  account: Account;
};

const OrdinalsAccount: React.FC<Props> = ({ account }) => {
  return (
    <Flex mb={50} width="100%" flexDirection="column" rowGap={40}>
      <Inscriptions account={account} />
      <RareSats />
    </Flex>
  );
};

export default OrdinalsAccount;
