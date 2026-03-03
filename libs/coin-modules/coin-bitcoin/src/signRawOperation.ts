import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { getAddressFormatDerivationMode } from "@ledgerhq/coin-framework/derivation";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { parsePsbt } from "@ledgerhq/psbtv2";
import type { Transaction } from "./types";
import { getNetworkParameters } from "./networks";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { getWalletAccount } from "./wallet-btc";
import { AddressFormat, SignerContext } from "./signer";
import { feeFromPsbt } from "./psbtFees";
import { fromAsyncOperation } from "./observable";
import {
  buildKnownAddressDerivationsMap,
  type KnownAddressDerivationsMap,
} from "./knownAddressDerivations";

type SignPsbtOptions = {
  accountPath: string;
  addressFormat: string;
  finalizePsbt: boolean;
  knownAddressDerivations: KnownAddressDerivationsMap;
  onDeviceSignatureRequested?: () => void;
  onDeviceSignatureGranted?: () => void;
  onDeviceStreaming?: (arg: { progress: number; total: number; index: number }) => void;
};

const signPsbtWithDevice = async (
  signerContext: SignerContext,
  deviceId: string,
  currency: CryptoCurrency,
  psbtBuffer: Buffer,
  options: SignPsbtOptions,
) =>
  signerContext(deviceId, currency, signer => {
    if (!signer.signPsbtBuffer) {
      throw new Error("signPsbtBuffer not available");
    }

    return signer.signPsbtBuffer(psbtBuffer, {
      accountPath: options.accountPath,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      addressFormat: options.addressFormat as AddressFormat,
      finalizePsbt: options.finalizePsbt,
      knownAddressDerivations: options.knownAddressDerivations,
      onDeviceSignatureRequested: options.onDeviceSignatureRequested,
      onDeviceSignatureGranted: options.onDeviceSignatureGranted,
      onDeviceStreaming: options.onDeviceStreaming,
    });
  });

export const buildSignRawOperation =
  (signerContext: SignerContext): AccountBridge<Transaction>["signRawOperation"] =>
  ({ account, deviceId, transaction: psbt, broadcast }) =>
    fromAsyncOperation(async o => {
      const { currency } = account;
      const walletAccount = getWalletAccount(account);

      log("hw", `signRawTransaction ${currency.id} for account ${account.id}`);

      const networkParams = getNetworkParameters(currency.id);
      const sigHashType = networkParams.sigHash;
      if (Number.isNaN(sigHashType)) {
        throw new TypeError("sigHashType should not be NaN");
      }

      const psbtBuffer = parsePsbt(psbt);

      const accountPath = `${walletAccount.params.path}/${walletAccount.params.index}'`;
      const knownAddressDerivations = await buildKnownAddressDerivationsMap(
        walletAccount,
        accountPath,
      );

      const psbtResult = await signPsbtWithDevice(signerContext, deviceId, currency, psbtBuffer, {
        accountPath,
        addressFormat: getAddressFormatDerivationMode(account.derivationMode),
        finalizePsbt: broadcast ?? false,
        knownAddressDerivations,
        onDeviceSignatureRequested: () => o.next({ type: "device-signature-requested" }),
        onDeviceSignatureGranted: () => o.next({ type: "device-signature-granted" }),
        onDeviceStreaming: arg => o.next({ type: "device-streaming", ...arg }),
      });

      if (!psbtResult) {
        throw new Error(
          `PSBT signing failed: no result from device for account ${account.id} (${currency.id})`,
        );
      }

      const parsedPsbtFee = feeFromPsbt(psbtBuffer);
      if (!parsedPsbtFee) {
        log(
          "hw",
          `Failed to extract fee from PSBT for account ${account.id} (${currency.id}); falling back to fee=0`,
        );
      }
      const psbtFee = parsedPsbtFee || BigNumber(0);

      // Optimistic operation for PSBT (we don't know recipients/amount here)
      const operation = buildOptimisticOperation({
        accountId: account.id,
        fee: psbtFee,
        extra: { psbt: true },
      });

      const base64Psbt = psbtResult.psbt.toString("base64");

      o.next({
        type: "signed",
        signedOperation: {
          operation,
          // When finalized, signature is the hex tx; otherwise it's the base64 PSBT
          signature: psbtResult.tx || base64Psbt,
          rawData: { psbtSigned: base64Psbt },
        },
      });
    });

export default buildSignRawOperation;
