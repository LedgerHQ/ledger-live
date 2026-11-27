import React, { useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { ReviewAsset } from "./ReviewAsset";
import { SelectAsset } from "./SelectAsset";

type Props = Readonly<{
  account: Account;
  token?: TokenCurrency;
  onClose: () => void;
}>;

export default function AddAssetDialog({ account, token: preselectedToken, onClose }: Props) {
  const [token, setToken] = useState(preselectedToken);
  const isDeviceBlocked = useDeviceBlocked();

  const close = () => {
    if (!isDeviceBlocked) onClose();
  };

  return (
    <Dialog animated open onOpenChange={open => !open && close()}>
      <DialogContent>
        <DialogBackgroundToneProvider>
          {token ? (
            <ReviewAsset
              account={account}
              token={token}
              onBack={() => setToken(undefined)}
              onClose={close}
            />
          ) : (
            <SelectAsset account={account} onSelect={setToken} onClose={close} />
          )}
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
