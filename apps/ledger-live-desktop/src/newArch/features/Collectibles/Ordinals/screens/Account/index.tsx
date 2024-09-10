import React from "react";
import Inscriptions from "../../components/Inscriptions";
import RareSats from "../../components/RareSats";
import { Flex } from "@ledgerhq/react-ui";
import useFetchOrdinals from "LLD/features/Collectibles/hooks/useFetchOrdinals";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";

type Props = {
  account: BitcoinAccount;
};

const OrdinalsAccount: React.FC<Props> = ({ account }) => {
  const { rareSats, inscriptions, ...rest } = useFetchOrdinals({
    account,
  });

  return (
    <Flex mb={50} width="100%" flexDirection="column" rowGap={40}>
      <Inscriptions inscriptions={inscriptions} {...rest} />
      <RareSats rareSats={rareSats} {...rest} />
    </Flex>
  );
};

export default OrdinalsAccount;
