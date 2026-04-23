import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import React, { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import type { NavigationSnapshot } from "../hooks/topologyChangeError";
import CantonOnboard from "./CantonOnboard";

interface CantonReonboardDrawerProps {
  currency: CryptoCurrency;
  accountToReonboard: Account;
  navigationSnapshot?: NavigationSnapshot;
}

export default function CantonReonboardDrawer({
  currency,
  accountToReonboard,
  navigationSnapshot,
}: Readonly<CantonReonboardDrawerProps>) {
  const dispatch = useDispatch();

  const handleComplete = useCallback(() => {
    setDrawer();

    if (navigationSnapshot?.type === "modal") {
      dispatch(openModal(navigationSnapshot.modalName, navigationSnapshot.modalData));
    } else if (navigationSnapshot?.type === "transfer-proposal") {
      const { handler, props } = navigationSnapshot;
      handler(props.contractId, props.action);
    }
  }, [dispatch, navigationSnapshot]);

  return (
    <CantonOnboard
      currency={currency}
      selectedAccounts={[]}
      isReonboarding
      accountToReonboard={accountToReonboard}
      onComplete={handleComplete}
    />
  );
}
