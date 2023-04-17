// @flow

import React, { useEffect } from "react";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { VaultTransport } from "@ledgerhq/hw-transport-http";
import { useSelector } from "react-redux";
import { setDeviceMode, currentMode } from "@ledgerhq/live-common/hw/actions/app";
import { vaultSignerSelector } from "~/renderer/reducers/settings";

const originalDeviceMode = currentMode;

/*
This component "listens" (with useEffect()) for changes in settings.vaultSigner and update
the vault-transport in the global modules object.
As this transport needs to be in sync with settings we couldn't register it
on the internal process.

To avoid cluttering the transport modules global object, we have updated it
to not blindly push in the array but to update it if it's already in the array

I'ts also important to check for the id of the transport in the open() method because
there is also IPC transport registered.
*/

const VaultSignerTransport = () => {
  const { token, enabled, host, workspace } = useSelector(vaultSignerSelector);
  useEffect(() => {
    if (enabled && currentMode !== "polling") {
      setDeviceMode("polling");
    } else if (!enabled) {
      setDeviceMode(originalDeviceMode);
    }
    registerTransportModule({
      id: "vault-transport",
      open: (id: string) => {
        if (id !== "vault-transport") return;
        return retry(() =>
          VaultTransport.open(host).then(transport => {
            transport.setData({ token, workspace });
            return Promise.resolve(transport);
          }),
        );
      },
      disconnect: () => Promise.resolve(),
    });
  }, [host, token, workspace, enabled]);

  return null;
};

export default VaultSignerTransport;
