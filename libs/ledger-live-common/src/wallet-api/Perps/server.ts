import calService, { convertCertificateToDeviceData } from "@ledgerhq/ledger-cal-service";
import { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { DmkSignerHyperliquid } from "@ledgerhq/live-signer-hyperliquid";
import { AccountLike } from "@ledgerhq/types-live";
import { customWrapper } from "@ledgerhq/wallet-api-server";
import { convertAction, type Action } from "./types";
import { getAccountIdFromWalletAccountId } from "../converters";
import { createAccountNotFound, createUnknownError, ServerError } from "@ledgerhq/wallet-api-core";
import { getMainAccount, getParentAccount } from "@ledgerhq/coin-framework/account/index";
import { firstValueFrom } from "rxjs";
import { AppResult } from "../../hw/actions/app";
import { Device } from "../../hw/actions/types";

export type PerpsUiHooks = {
  "device.select": (params: {
    appName: string | undefined;
    onSuccess: (result: Pick<AppResult, "device">) => void;
    onCancel: () => void;
  }) => void;
};

export type ActionWithNonce = {
  action: Action;
  nonce: number;
};
export type PerpsSignParams = {
  accountId: string;
  metadataWithSignature: string;
  actions: ActionWithNonce[];
};
export type Signature = {
  r: string;
  s: string;
  v: number;
};
export type PerpsSignResult = {
  signatures: Signature[];
};

export const handlers = ({
  accounts,
  dmk,
  uiHooks: { "device.select": uiDeviceSelect },
}: {
  accounts: AccountLike[];
  dmk: DeviceManagementKit;
  uiHooks: PerpsUiHooks;
}) => {
  return {
    "custom.perps.signActions": customWrapper<PerpsSignParams, PerpsSignResult>(async params => {
      if (!params) {
        // tracking. (manifest);
        throw new ServerError(createUnknownError({ message: "params is undefined" }));
      }

      // Retrieve account
      const realAccountId = getAccountIdFromWalletAccountId(params.accountId);
      const account = accounts.find(acc => acc.id === realAccountId);
      if (!account) {
        throw new ServerError(createAccountNotFound(params.accountId));
      }

      const derivationPath = getMainAccount(
        account,
        getParentAccount(account, accounts),
      )?.freshAddressPath;
      if (!derivationPath) {
        throw new ServerError(
          createUnknownError({ message: "unable to retrieve derivation path" }),
        );
      }

      // Ask user to select a device via the UI
      const device = await new Promise<Device>((resolve, reject) => {
        uiDeviceSelect({
          appName: "Hyperliquid",
          onSuccess: ({ device }) => resolve(device),
          onCancel: () => reject(new Error("User cancelled device selection")),
        });
      });

      // CALL Cal Service
      const certificate = await calService.getCertificate(device.modelId, "perps_data");

      // Locate the already-discovered DMK device matching the selected deviceId
      const availableDevices = await firstValueFrom(dmk.listenToAvailableDevices({}));
      console.log("PERPS server device:", device, availableDevices);
      // const discoveredDevice: DiscoveredDevice | undefined = availableDevices.find(
      //   d => d.id === device.deviceId,
      // );
      const discoveredDevice = availableDevices[0];
      if (!discoveredDevice) {
        throw new ServerError(createUnknownError({ message: "Selected device not found in DMK" }));
      }

      // Open a DMK session for the selected device
      const sessionId = await dmk.connect({
        device: discoveredDevice,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });

      // CALL HyperLiquid Signer
      const hyperliquidSigner = new DmkSignerHyperliquid(dmk, sessionId);
      try {
        const signatures = await hyperliquidSigner.signActions(
          derivationPath,
          convertCertificateToDeviceData(certificate),
          new Uint8Array(Buffer.from(params.metadataWithSignature, "hex")),
          params.actions.map(convertAction),
        );

        return { signatures };
      } finally {
        await dmk.disconnect({ sessionId });
      }
    }),
  };
};
