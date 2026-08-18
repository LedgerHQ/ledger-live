import { pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { BitcoinAddress, BitcoinXPub, SignerContext } from "../../signer";
import type { Transaction } from "../../types";
import { DmkSignerZcash } from "@ledgerhq/live-signer-zcash";
import type { ZcashAddress, ZcashViewKey } from "@ledgerhq/live-signer-zcash";
import { registerChainAdapter } from "../registry";
import type { ChainAdapter } from "../types";
import type { ZcashAccount, ZcashAccountRaw } from "./types";
import { composeXpub } from "./xpub";
import { resolveZcashFeePerByte } from "./transparent-fee-rate";
import { fromZcashPrivateInfoRaw, toZcashPrivateInfoRaw } from "./serialization";

// ── DMK transport helpers ─────────────────────────────────────────────────

type DmkTransport = {
  dmk: ConstructorParameters<typeof DmkSignerZcash>[0];
  sessionId: string;
};

const isDmkTransport = (transport: unknown): transport is DmkTransport =>
  !!transport &&
  typeof transport === "object" &&
  "dmk" in transport &&
  "sessionId" in transport &&
  typeof (transport as { sessionId: unknown }).sessionId === "string";

type ZcashLikeSigner = {
  getAddress: (path: string, display?: boolean) => Promise<ZcashAddress>;
  getFullViewingKey: (path: string) => Promise<ZcashViewKey>;
};

const isZcashSigner = (signer: unknown): signer is ZcashLikeSigner =>
  !!signer && typeof signer === "object";

const hasGetAddressFunction = (signer: unknown): signer is ZcashLikeSigner =>
  isZcashSigner(signer) && "getAddress" in signer && typeof signer.getAddress === "function";

const hasGetFullViewingKeyFunction = (signer: unknown): signer is ZcashLikeSigner =>
  isZcashSigner(signer) &&
  "getFullViewingKey" in signer &&
  typeof signer.getFullViewingKey === "function";

const zcashChainAdapter: ChainAdapter = {
  id: "zcash",

  /**
   * Prices the transparent PSBT path — the only path a Zcash send takes here
   * (the shielded/PCZT path lives in `@ledgerhq/coin-zcash`, not in this
   * adapter). The prepared rate covers ZIP-317 for any layout (see
   * zcashSafeFeePerByte); it is the starting point and the fallback of the
   * resolution.
   */
  resolveFeePerByte(account: Account, transaction: Transaction) {
    const safeFeePerByte = transaction.feePerByte;
    if (!safeFeePerByte || safeFeePerByte.lte(0)) return undefined;
    return resolveZcashFeePerByte(account, transaction, safeFeePerByte);
  },

  // Persist the shielded state alongside the transparent bitcoinResources. The
  // bitcoin bridge is what reads a Zcash account back at app startup (the
  // `zcashShielded` flag is not mirrored yet then), so this must not be gated
  // on the flag or the ufvk is lost on every restart.
  assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
    const zcashAccount = account as ZcashAccount;
    if (zcashAccount.privateInfo) {
      (accountRaw as ZcashAccountRaw).privateInfo = toZcashPrivateInfoRaw(zcashAccount.privateInfo);
    }
  },

  assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
    const zcashPrivateInfoRaw = (accountRaw as ZcashAccountRaw).privateInfo;
    if (zcashPrivateInfoRaw) {
      (account as ZcashAccount).privateInfo = fromZcashPrivateInfoRaw(zcashPrivateInfoRaw);
    }
  },

  getAddress(deviceId, { currency, path, verify }, signerContext: SignerContext) {
    return signerContext(deviceId, currency, async signer => {
      if (!hasGetAddressFunction(signer)) {
        throw new Error("Zcash signer must implement getAddress(path, display?)");
      }
      const { address, publicKey, chainCode } = await signer.getAddress(path, verify || false);
      return {
        bitcoinAddress: address,
        publicKey,
        chainCode,
      } satisfies BitcoinAddress;
    });
  },

  getWalletXpub(
    deviceId,
    { currency, accountPath, xpubVersion },
    signerContext: SignerContext,
  ): Promise<BitcoinXPub> {
    return signerContext(deviceId, currency, async signer => {
      if (!hasGetAddressFunction(signer)) {
        throw new Error("Zcash signer must implement getAddress(path, display?)");
      }

      // The DMK Zcash signer-kit only exposes `getAddress`. Replicate the
      // legacy `BtcOld.getWalletXpub` flow: fetch both the account-level key
      // (for chaincode + pubkey) and the parent key (for the fingerprint),
      // then BIP32-serialize them locally.
      const accountPathElements = pathStringToArray(accountPath);
      if (accountPathElements.length === 0) {
        throw new Error(`Cannot derive xpub from empty path "${accountPath}"`);
      }
      const parentPath = accountPath.split("/").slice(0, -1).join("/");
      const childNumber = accountPathElements[accountPathElements.length - 1];

      const parent = await signer.getAddress(parentPath, false);
      const account = await signer.getAddress(accountPath, false);

      return composeXpub({
        xpubVersion,
        depth: accountPathElements.length,
        childNumber,
        parentPublicKeyHex: parent.publicKey,
        accountPublicKeyHex: account.publicKey,
        accountChainCodeHex: account.chainCode,
      });
    });
  },

  getFullViewingKey(deviceId, currency, path, signerContext: SignerContext) {
    return signerContext(deviceId, currency, async signer => {
      if (!hasGetFullViewingKeyFunction(signer)) {
        throw new Error("Zcash signer must implement getFullViewingKey(path)");
      }
      const { viewKey } = await signer.getFullViewingKey(path);
      return viewKey;
    });
  },

  createSigner(transport, _currency, defaultSigner) {
    if (!isDmkTransport(transport)) return undefined;

    // Augment the default BitcoinSigner with DmkSignerZcash methods.
    // This gives chain adapter overrides (getAddress, getWalletXpub, getFullViewingKey)
    // access to the DMK signer. Transparent signing also routes through the DMK
    // signer via createPaymentTransaction; the remaining BitcoinSigner methods
    // (e.g. splitTransaction) continue to come from Btc.
    const dmk = new DmkSignerZcash(transport.dmk, transport.sessionId);

    // Wrap splitTransaction to carry the original raw hex on the returned
    // object. wallet.signAccountTx discards i.txHex after calling splitTransaction
    // and only forwards the parsed structure to createPaymentTransaction.
    // Without the raw bytes, DmkSignerZcash cannot populate
    // serializedPreviousTransactionOverride, so the device receives a truncated
    // transaction (Orchard bundle stripped by serializeTransaction) and computes
    // a wrong ZIP-244 txid — causing "Missing inputs" on broadcast.
    const baseSplitTransaction = defaultSigner.splitTransaction.bind(defaultSigner);

    return Object.assign(defaultSigner, {
      splitTransaction: (
        transactionHex: string,
        isSegwitSupported: boolean | null | undefined,
        hasExtraData: boolean | null | undefined,
        additionals: Array<string> | null | undefined,
      ) => {
        const result = baseSplitTransaction(
          transactionHex,
          isSegwitSupported,
          hasExtraData,
          additionals,
        );
        return { ...result, rawTxHex: transactionHex };
      },
      getAddress: dmk.getAddress.bind(dmk),
      getFullViewingKey: dmk.getFullViewingKey.bind(dmk),
      createPaymentTransaction: dmk.createPaymentTransaction.bind(dmk),
      signPcztTransaction: dmk.signPcztTransaction.bind(dmk),
    });
  },
};

registerChainAdapter(zcashChainAdapter);
