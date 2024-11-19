import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import useFetchOrdinals from "LLD/features/Collectibles/hooks/useFetchOrdinals";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { setHasSeenOrdinalsDiscoveryDrawer } from "~/renderer/actions/settings";
import { hasSeenOrdinalsDiscoveryDrawerSelector } from "~/renderer/reducers/settings";
import { findCorrespondingSat } from "LLD/features/Collectibles/utils/findCorrespondingSat";
import { useHideInscriptions } from "LLD/features/Collectibles/hooks/useHideInscriptions";
import { useCollectiblesAnalytics } from "../../../hooks/useCollectiblesAnalytics";
import { AnalyticsButton, AnalyticsPage } from "LLD/features/Collectibles/types/enum/Analytics";

interface Props {
  account: BitcoinAccount;
}

export const useBitcoinAccountModel = ({ account }: Props) => {
  const dispatch = useDispatch();

  const hasSeenDiscoveryDrawer = useSelector(hasSeenOrdinalsDiscoveryDrawerSelector);
  const [selectedInscription, setSelectedInscription] = useState<SimpleHashNft | null>(null);
  const [correspondingRareSat, setCorrespondingRareSat] = useState<
    SimpleHashNft | null | undefined
  >(null);

  const { rareSats, inscriptions, inscriptionsGroupedWithRareSats, ...rest } = useFetchOrdinals({
    account,
  });

  const { filterInscriptions } = useHideInscriptions();
  const filteredInscriptions = filterInscriptions(inscriptions);
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

  const hasInscriptions = inscriptions.length > 0;
  const hasRareSat = rareSats.length > 0;

  const { onClickTrack } = useCollectiblesAnalytics({ hasInscriptions, hasRareSat });

  const onInscriptionClick = (inscription: SimpleHashNft) => {
    const groupedNft = findCorrespondingSat(inscriptionsGroupedWithRareSats, inscription.nft_id);
    onClickTrack({ button: AnalyticsButton.Inscription, page: AnalyticsPage.Account });
    setCorrespondingRareSat(groupedNft?.rareSat ?? null);
    setSelectedInscription(inscription);
  };

  const onDetailsDrawerClose = () => setSelectedInscription(null);

  return {
    rareSats,
    inscriptions: filteredInscriptions,
    rest,
    isDrawerOpen,
    selectedInscription,
    correspondingRareSat,
    inscriptionsGroupedWithRareSats,
    onReceive,
    handleDrawerClose,
    onInscriptionClick,
    onDetailsDrawerClose,
  };
};
