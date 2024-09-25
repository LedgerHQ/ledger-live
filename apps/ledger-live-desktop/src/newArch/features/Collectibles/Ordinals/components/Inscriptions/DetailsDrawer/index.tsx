import React from "react";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";

type Props = {
  inscription: SimpleHashNft;
  onClose: () => void;
};
const InscriptionDetailsDrawer: React.FC<Props> = ({ inscription, onClose }) => {
  // will be replaced by DetailsDrawer from collectibles
  return (
    <SideDrawer direction={"left"} isOpen={!!inscription} onRequestClose={onClose}>
      {inscription.name || inscription.contract.name}
    </SideDrawer>
  );
};

export default InscriptionDetailsDrawer;
