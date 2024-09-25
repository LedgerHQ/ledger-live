import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import useFetchOrdinals from "LLD/features/Collectibles/hooks/useFetchOrdinals";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { setHasSeenOrdinalsDiscoveryDrawer } from "~/renderer/actions/settings";
import { hasSeenOrdinalsDiscoveryDrawerSelector } from "~/renderer/reducers/settings";

interface Props {
  account: BitcoinAccount;
}

export const useBitcoinAccountModel = ({ account }: Props) => {
  const dispatch = useDispatch();
  const hasSeenDiscoveryDrawer = useSelector(hasSeenOrdinalsDiscoveryDrawerSelector);
  const [selectedInscription, setSelectedInscription] = useState<SimpleHashNft | null>(null);

  const { rareSats, inscriptions, ...rest } = useFetchOrdinals({ account });

  const [isDrawerOpen, setIsDrawerOpen] = useState(!hasSeenDiscoveryDrawer);

  useEffect(() => {
    if (hasSeenDiscoveryDrawer) {
      setIsDrawerOpen(false);
    }
  }, [hasSeenDiscoveryDrawer]);

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    dispatch(setHasSeenOrdinalsDiscoveryDrawer(true));
  };

  const onReceive = useCallback(() => {
    dispatch(
      openModal("MODAL_RECEIVE", {
        account,
        receiveOrdinalMode: true,
      }),
    );
  }, [dispatch, account]);

  const onInscriptionClick = (inscription: SimpleHashNft) => setSelectedInscription(inscription);

  const onDetailsDrawerClose = () => setSelectedInscription(null);

  return {
    rareSats,
    inscriptions,
    rest,
    isDrawerOpen,
    selectedInscription,
    onReceive,
    handleDrawerClose,
    onInscriptionClick,
    onDetailsDrawerClose,
  };
};
