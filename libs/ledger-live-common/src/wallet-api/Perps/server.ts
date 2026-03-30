import calService, { convertCertificateToDeviceData } from "@ledgerhq/ledger-cal-service";
import { DmkSignerHyperliquid } from "@ledgerhq/live-signer-hyperliquid";
import { AccountLike } from "@ledgerhq/types-live";
import { customWrapper } from "@ledgerhq/wallet-api-server";
import { convertAction, type ActionWithNonce } from "./types";
import { getAccountIdFromWalletAccountId } from "../converters";
import { createAccountNotFound, createUnknownError, ServerError } from "@ledgerhq/wallet-api-core";
import { getMainAccount, getParentAccount } from "../../account";
import { firstValueFrom, from } from "rxjs";
import { AppResult } from "../../hw/actions/app";
import { Device } from "../../hw/actions/types";
import { withDevice } from "../../hw/deviceAccess";
import { isDmkTransport } from "../../hw/dmkUtils";
import { stripHexPrefix } from "../helpers";

type AppOption = {
  requireLatestFirmware: boolean;
  allowPartialDependencies: boolean;
  skipAppInstallIfNotFound: boolean;
};
export type PerpsUiHooks = {
  "device.select": (params: {
    appName: string | undefined;
    appOptions?: AppOption;
    onSuccess: (result: Pick<AppResult, "device">) => void;
    onCancel: () => void;
  }) => void;
};

export type PerpsSignParams = {
  accountId: string;
  metadataWithSignature: string;
  actions: ActionWithNonce[];
  options?: AppOption;
};
export type Signature = {
  r: string;
  s: string;
  v: number;
};
export type PerpsSignResult = {
  signatures: Signature[];
};

const PERPS_APP_NAME = "Hyperliquid";

export const handlers = ({
  accounts,
  uiHooks: { "device.select": uiDeviceSelect },
}: {
  accounts: AccountLike[];
  uiHooks: PerpsUiHooks;
}) => {
  return {
    "custom.perps.signActions": customWrapper<PerpsSignParams, PerpsSignResult>(async params => {
      if (!params) {
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
          appName: PERPS_APP_NAME,
          appOptions: params.options,
          onSuccess: ({ device }) => resolve(device),
          onCancel: () => reject(new Error("User cancelled device selection")),
        });
      });

      // CALL Cal Service
      const certificate = await calService.getCertificate(device.modelId, "perps_data");

      return firstValueFrom(
        withDevice(
          device.deviceId,
          device.deviceName ? { matchDeviceByName: device.deviceName } : undefined,
        )(transport =>
          from(
            (async () => {
              if (!isDmkTransport(transport)) {
                throw new Error("Not DMK transport");
              }
              const { dmk, sessionId } = transport;

              const hyperliquidSigner = new DmkSignerHyperliquid(dmk, sessionId);
              const signatures = await hyperliquidSigner.signActions(
                derivationPath,
                convertCertificateToDeviceData(certificate),
                new Uint8Array(Buffer.from(stripHexPrefix(params.metadataWithSignature), "hex")),
                params.actions.map(convertAction),
              );

              return { signatures };
            })(),
          ),
        ),
      );
    }),
  };
};
