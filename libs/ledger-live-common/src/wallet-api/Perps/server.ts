import calService, { convertCertificateToDeviceData } from "@ledgerhq/ledger-cal-service";
import { DmkSignerHyperliquid } from "@ledgerhq/live-signer-hyperliquid";
import { AccountLike } from "@ledgerhq/types-live";
import { customWrapper } from "@ledgerhq/wallet-api-server";
import { convertAction, type ActionWithNonce } from "./types";
import { getAccountIdFromWalletAccountId } from "../converters";
import { createAccountNotFound, createUnknownError, ServerError } from "@ledgerhq/wallet-api-core";
import { getMainAccount, getParentAccount } from "../../account";
import { firstValueFrom, from } from "rxjs";
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
  "signing.execute": (params: {
    appName: string | undefined;
    appOptions?: AppOption;
    signFactory: (device: Device) => Promise<PerpsSignResult>;
    onSuccess: (result: PerpsSignResult) => void;
    onError: (error: Error) => void;
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
  uiHooks: { "signing.execute": uiSigningExecute },
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

      return new Promise<PerpsSignResult>((resolve, reject) => {
        uiSigningExecute({
          appName: PERPS_APP_NAME,
          appOptions: params.options,
          signFactory: (device: Device) =>
            firstValueFrom(
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

                    const certificate = await calService.getCertificate(
                      device.modelId,
                      "perps_data",
                    );
                    const hyperliquidSigner = new DmkSignerHyperliquid(dmk, sessionId);
                    const signatures = await hyperliquidSigner.signActions(
                      derivationPath,
                      convertCertificateToDeviceData(certificate),
                      new Uint8Array(
                        Buffer.from(stripHexPrefix(params.metadataWithSignature), "hex"),
                      ),
                      params.actions.map(convertAction),
                    );

                    return { signatures };
                  })(),
                ),
              ),
            ),
          onSuccess: resolve,
          onError: reject,
          onCancel: () => reject(new Error("User cancelled signing")),
        });
      });
    }),
  };
};
