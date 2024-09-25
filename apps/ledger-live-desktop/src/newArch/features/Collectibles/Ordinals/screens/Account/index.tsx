import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import Inscriptions from "../../components/Inscriptions";
import RareSats from "../../components/RareSats";
import DiscoveryDrawer from "../../components/Inscriptions/DiscoveryDrawer";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import { useBitcoinAccountModel } from "./useBitcoinAccountModel";
import InscriptionDetailsDrawer from "../../components/Inscriptions/DetailsDrawer";

type ViewProps = ReturnType<typeof useBitcoinAccountModel>;

interface Props {
  account: BitcoinAccount;
}

const View: React.FC<ViewProps> = ({
  inscriptions,
  rest,
  rareSats,
  isDrawerOpen,
  selectedInscription,
  handleDrawerClose,
  onReceive,
  onInscriptionClick,
  onDetailsDrawerClose,
}) => (
  <Flex mb={50} width="100%" flexDirection="column" rowGap={40}>
    <Inscriptions
      inscriptions={inscriptions}
      onReceive={onReceive}
      onInscriptionClick={onInscriptionClick}
      {...rest}
    />
    <RareSats rareSats={rareSats} onReceive={onReceive} {...rest} />
    <DiscoveryDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
    {selectedInscription && (
      <InscriptionDetailsDrawer inscription={selectedInscription} onClose={onDetailsDrawerClose} />
    )}
  </Flex>
);

const OrdinalsAccount: React.FC<Props> = ({ account }) => (
  <View {...useBitcoinAccountModel({ account })} />
);

export default OrdinalsAccount;
