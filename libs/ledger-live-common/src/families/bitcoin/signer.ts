import Btc from "@ledgerhq/hw-app-btc";
import type Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import { UnsupportedDerivation } from "@ledgerhq/ledger-wallet-framework/errors";
import { getAddressFormatDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { DerivationMode } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { AccountLayerDeviceEvents } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { BitcoinSigningEnvelope } from "@ledgerhq/coin-bitcoin/api";
import { BITCOIN_SIGNING_ENVELOPE_VERSION } from "@ledgerhq/coin-bitcoin/api";
import { executeWithSigner } from "../../bridge/setup";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";

export type AddressFormat = "legacy" | "p2sh" | "bech32" | "bech32m" | "cashaddr";

export type BitcoinAddressResult = {
  address: string;
  publicKey: string;
  chainCode?: string;
  path: string;
};

export type BitcoinSignature = { v: number; r: string; s: string };

/**
 * The device operations of the bitcoin family, over one transport. The Ledger app to talk to
 * depends on the currency, so every operation names it.
 */
export type BitcoinDeviceSigner = {
  getAddress(
    path: string,
    options: {
      currencyId: string;
      derivationMode?: string;
      verify?: boolean;
      forceFormat?: string;
    },
  ): Promise<BitcoinAddressResult>;
  /** Signs the transaction `craftTransaction` describes (a JSON signing envelope). */
  signTransaction(
    path: string,
    envelope: string,
    options?: Partial<AccountLayerDeviceEvents>,
  ): Promise<string>;
  getWalletXpub(args: { currencyId: string; path: string; xpubVersion: number }): Promise<string>;
  signPsbtBuffer(
    currencyId: string,
    psbt: Buffer,
    options: Parameters<NonNullable<Btc["signPsbtBuffer"]>>[1],
  ): Promise<{ psbt: Buffer; tx?: string }>;
  signMessage(currencyId: string, path: string, messageHex: string): Promise<BitcoinSignature>;
};

function parseEnvelope(envelope: string): BitcoinSigningEnvelope {
  const parsed = JSON.parse(envelope) as BitcoinSigningEnvelope;
  if (parsed?.version !== BITCOIN_SIGNING_ENVELOPE_VERSION) {
    throw new Error(`Unsupported bitcoin signing envelope version ${String(parsed?.version)}`);
  }
  return parsed;
}

// Bitcoin Cash addresses are verified in their cashaddr form, the one the account shows.
const addressFormat = (currencyId: string, derivationMode?: string, forceFormat?: string) =>
  (forceFormat as AddressFormat | undefined) ??
  (currencyId === "bitcoin_cash"
    ? "cashaddr"
    : (getAddressFormatDerivationMode((derivationMode ?? "") as DerivationMode) as AddressFormat));

export const createSigner = (transport: Transport): BitcoinDeviceSigner => {
  const apps = new Map<string, Btc>();
  const btcFor = (currencyId: string): Btc => {
    let btc = apps.get(currencyId);
    if (!btc) {
      btc = new Btc({ transport, currency: currencyId });
      apps.set(currencyId, btc);
    }
    return btc;
  };

  return {
    async getAddress(path, { currencyId, derivationMode, verify, forceFormat }) {
      try {
        const { bitcoinAddress, publicKey, chainCode } = await btcFor(
          currencyId,
        ).getWalletPublicKey(path, {
          verify: verify || false,
          format: addressFormat(currencyId, derivationMode, forceFormat),
        });
        log("hw", `getAddress ${currencyId} path=${path} address=${bitcoinAddress}`);
        return { address: bitcoinAddress, publicKey, path, ...(chainCode ? { chainCode } : {}) };
      } catch (e) {
        const message = (e as Error)?.message ?? "";
        if (message.includes("invalid format") || message.includes("Unsupported address format")) {
          throw new UnsupportedDerivation();
        }
        throw e;
      }
    },

    async signTransaction(_path, raw, options = {}) {
      const envelope = parseEnvelope(raw);
      const btc = btcFor(envelope.currency);
      const inputs = envelope.inputs.map(
        input =>
          [
            btc.splitTransaction(
              input.prevTxHex,
              true,
              envelope.hasExtraData,
              envelope.additionals,
            ),
            input.outputIndex,
            null,
            input.sequence,
            input.blockHeight,
          ] as [ReturnType<Btc["splitTransaction"]>, number, null, number, number | null],
      );
      return btc.createPaymentTransaction({
        inputs: inputs as Parameters<Btc["createPaymentTransaction"]>[0]["inputs"],
        associatedKeysets: envelope.inputs.map(input => input.path),
        outputScriptHex: envelope.outputScriptHex,
        blockHeight: envelope.blockHeight,
        ...(envelope.lockTime ? { lockTime: envelope.lockTime } : {}),
        ...(envelope.sigHashType ? { sigHashType: envelope.sigHashType } : {}),
        ...(envelope.segwit ? { segwit: envelope.segwit } : {}),
        ...(envelope.expiryHeight
          ? { expiryHeight: Buffer.from(envelope.expiryHeight, "hex") }
          : {}),
        ...(envelope.changePath ? { changePath: envelope.changePath } : {}),
        additionals: envelope.additionals,
        onDeviceStreaming: options.onDeviceStreaming,
        onDeviceSignatureRequested: options.onDeviceSignatureRequested,
        onDeviceSignatureGranted: options.onDeviceSignatureGranted,
      });
    },

    getWalletXpub: ({ currencyId, path, xpubVersion }) =>
      btcFor(currencyId).getWalletXpub({ path, xpubVersion }),

    async signPsbtBuffer(currencyId, psbt, options) {
      const btc = btcFor(currencyId);
      if (!btc.signPsbtBuffer) throw new Error("signPsbtBuffer not available");
      return btc.signPsbtBuffer(psbt, options);
    },

    signMessage: (currencyId, path, messageHex) => btcFor(currencyId).signMessage(path, messageHex),
  };
};

const context: SignerContext<BitcoinDeviceSigner> = executeWithSigner(createSigner);

/** Address resolver of the bitcoin family, as the scan, the receive flow and swap call it. */
export const resolver =
  (signerContext: SignerContext<BitcoinDeviceSigner>): GetAddressFn =>
  (deviceId, { currency, path, verify, derivationMode, forceFormat }) =>
    signerContext(deviceId, signer =>
      signer.getAddress(path, {
        currencyId: currency.id,
        derivationMode,
        ...(verify === undefined ? {} : { verify }),
        ...(typeof forceFormat === "string" ? { forceFormat } : {}),
      }),
    );

export default {
  context,
  getAddress: resolver(context),
} satisfies CoinFrameworkSigner<BitcoinDeviceSigner>;
