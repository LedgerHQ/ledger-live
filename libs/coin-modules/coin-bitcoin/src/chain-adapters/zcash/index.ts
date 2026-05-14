import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { ChainAdapter } from "../types";
import type { BitcoinAddress, SignerContext } from "../../signer";
import type { Transaction } from "../../types";
import { DmkSignerZcash, ZcashAddress } from "@ledgerhq/live-signer-zcash";
import { registerChainAdapter } from "../registry";
import type { ZcashAccount, ZcashAccountRaw } from "./types";
import { toZcashPrivateInfoRaw, fromZcashPrivateInfoRaw } from "./serialization";
import { buildExtraSyncObservable } from "./sync";

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

const isZcashSigner = (
  signer: unknown,
): signer is { getAddress: (path: string, display?: boolean) => Promise<ZcashAddress> } =>
  !!signer &&
  typeof signer === "object" &&
  "getAddress" in signer &&
  typeof signer.getAddress === "function";

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
      if (!isZcashSigner(signer)) {
        throw new Error("Zcash signer must implement getAddress(path, display?)");
      }
      const { address } = await signer.getAddress(path, verify || false);
      return {
        bitcoinAddress: address,
        publicKey: "",
        chainCode: "",
      } satisfies BitcoinAddress;
    });
  },

  createSigner(transport, _currency) {
    if (!isDmkTransport(transport)) {
      throw new Error("Zcash requires DMK transport");
    }
    return new DmkSignerZcash(transport.dmk, transport.sessionId);
  },
};

registerChainAdapter(zcashChainAdapter);
