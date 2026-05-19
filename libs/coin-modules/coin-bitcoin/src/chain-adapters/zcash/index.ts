import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { ChainAdapter } from "../types";
import type { BitcoinAddress, BitcoinXPub, SignerContext } from "../../signer";
import type { Transaction } from "../../types";
import { DmkSignerZcash } from "@ledgerhq/live-signer-zcash";
import type { ZcashAddress, ZcashViewKey } from "@ledgerhq/live-signer-zcash";
import { registerChainAdapter } from "../registry";
import type { ZcashAccount, ZcashAccountRaw } from "./types";
import { toZcashPrivateInfoRaw, fromZcashPrivateInfoRaw } from "./serialization";
import { buildExtraSyncObservable } from "./sync";
import { composeXpub } from "./xpub";

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

  // ── Sync ────────────────────────────────────────────────────────────

  buildExtraSyncObservable,

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

  // ── Transaction ─────────────────────────────────────────────────────
  // All Zcash transactions (transparent + shielded) will use PCZT.
  // Until PCZT is implemented, returning undefined falls back to Bitcoin legacy path.

  signOperation(
    _account: Account,
    _deviceId: string,
    _transaction: Transaction,
    _signerContext: SignerContext,
  ) {
    // TODO: implement PCZT signing for all Zcash transactions
    return undefined;
  },

  getTransactionStatus(_account: Account, _transaction: Transaction) {
    // TODO: implement PCZT transaction validation + ZIP-317 fee estimation
    return undefined;
  },

  estimateMaxSpendable(
    _account: Account,
    _parentAccount: Account | null | undefined,
    _transaction: Transaction | null | undefined,
  ) {
    // TODO: implement PCZT balance estimation
    return undefined;
  },

  prepareTransaction(_account: Account, _transaction: Transaction) {
    // TODO: implement PCZT transaction preparation (ZIP-317 fee info)
    return undefined;
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
    // access to the DMK signer, while signOperation keeps using BitcoinSigner methods from Btc.
    const dmk = new DmkSignerZcash(transport.dmk, transport.sessionId);
    return Object.assign(defaultSigner, {
      getAddress: dmk.getAddress.bind(dmk),
      getFullViewingKey: dmk.getFullViewingKey.bind(dmk),
    });
  },
};

registerChainAdapter(zcashChainAdapter);
