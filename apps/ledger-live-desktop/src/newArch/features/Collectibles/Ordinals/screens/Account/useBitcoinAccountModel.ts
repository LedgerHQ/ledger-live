import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import useFetchOrdinals from "LLD/features/Collectibles/hooks/useFetchOrdinals";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setHasSeenOrdinalsDiscoveryDrawer } from "~/renderer/actions/settings";
import { hasSeenOrdinalsDiscoveryDrawerSelector } from "~/renderer/reducers/settings";

interface Props {
  account: BitcoinAccount;
}

export const useBitcoinAccountModel = ({ account }: Props) => {
  const dispatch = useDispatch();
  const hasSeenDiscoveryDrawer = useSelector(hasSeenOrdinalsDiscoveryDrawerSelector);

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

  return { rareSats, inscriptions, rest, isDrawerOpen, handleDrawerClose };
};
