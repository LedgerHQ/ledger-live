import { useEffect } from "react";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { trackPage } from "@shared/analytics";
import type { ReceiveAddressTracking } from "./receiveAddressTracking";

type Params = Readonly<{
  shownKey: string | undefined;
  assetId: CryptoOrTokenCurrencyId;
  descriptor: AccountDescriptor | undefined;
  isVerified: boolean;
  isVerifyPopoverDisplayed: boolean;
  canVerifyOnDevice: boolean;
  isTokenAssociationRequired: boolean;
  tracking: ReceiveAddressTracking;
}>;

export function useReceiveAddressPageEvent({
  shownKey,
  assetId,
  descriptor,
  isVerified,
  isVerifyPopoverDisplayed,
  canVerifyOnDevice,
  isTokenAssociationRequired,
  tracking,
}: Params) {
  const network = descriptor?.network;

  useEffect(() => {
    if (!shownKey || !network) return;
    void trackPage({
      category: "Receive - Confirmation",
      props: {
        asset: assetId,
        network,
        isVerified,
        isVerifyPopoverDisplayed,
        canVerifyOnDevice,
        isTokenAssociationRequired,
        ...tracking,
      },
    });
    // Once per address shown: later changes of the flags are not a new page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey, network]);
}
