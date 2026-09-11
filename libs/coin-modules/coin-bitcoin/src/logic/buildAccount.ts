import BitcoinLikeWallet from "@ledgerhq/wallet-btc/wallet";
import type { Account as WalletBtcAccount } from "@ledgerhq/wallet-btc/account";
import type { Currency } from "@ledgerhq/wallet-btc/crypto/types";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { walletBtcCurrencyById } from "../walletBtcCurrency";
// wallet-btc's logging is injected; pass `@ledgerhq/logs` for now — becomes the ADR-019
// `context.log` once threaded through the Alpaca layer.
import { log } from "@ledgerhq/logs";

/** Ledger address format used by the device signer, derived from the script type. */
export type BitcoinAddressFormat = "legacy" | "p2sh" | "bech32" | "bech32m";

/** Account metadata derived from the BIP44/49/84/86 derivation path. */
export type AccountMeta = {
  /** Purpose'/coin' prefix, e.g. `84'/0'`. */
  rootPath: string;
  /** Account-level index (the third path element). */
  accountIndex: number;
  /** Full account path, e.g. `84'/0'/0'` — what the device signer expects. */
  accountPath: string;
  derivationMode: DerivationModes;
  addressFormat: BitcoinAddressFormat;
};

const derivationModeFromPurpose = (purpose: number): DerivationModes => {
  switch (purpose) {
    case 86:
      return DerivationModes.TAPROOT;
    case 84:
      return DerivationModes.NATIVE_SEGWIT;
    case 49:
      return DerivationModes.SEGWIT;
    case 44:
      return DerivationModes.LEGACY;
    default:
      throw new Error(
        `coin-bitcoin: unsupported derivation purpose in path (expected 44'/49'/84'/86'): ${purpose}`,
      );
  }
};

const addressFormatFor = (mode: DerivationModes): BitcoinAddressFormat => {
  switch (mode) {
    case DerivationModes.TAPROOT:
      return "bech32m";
    case DerivationModes.NATIVE_SEGWIT:
      return "bech32";
    case DerivationModes.SEGWIT:
      return "p2sh";
    default:
      return "legacy";
  }
};

/**
 * Parse the account metadata (paths, script type, address format) from a derivation path.
 * Address derivation from an already-account-level xpub only needs the script type and account
 * index — both encoded in the path (BIP44/49/84/86 purpose + account level).
 */
export function deriveAccountMeta(derivationPath: string | undefined): AccountMeta {
  if (!derivationPath) {
    throw new Error("coin-bitcoin Alpaca requires a derivation path alongside the xpub");
  }
  const parts = derivationPath.split("/").filter(Boolean);
  if (parts.length < 3) {
    throw new Error(
      `coin-bitcoin: derivation path must include at least purpose'/coin'/account' — got "${derivationPath}"`,
    );
  }
  const purpose = parseInt(parts[0], 10);
  const accountIndex = parseInt(parts[2].replace(/'$/, ""), 10);
  const rootPath = parts.slice(0, 2).join("/");
  const derivationMode = derivationModeFromPurpose(purpose);
  return {
    rootPath,
    accountIndex,
    accountPath: `${rootPath}/${accountIndex}'`,
    derivationMode,
    addressFormat: addressFormatFor(derivationMode),
  };
}

/**
 * Build and fully sync a wallet-btc account from an xpub — STATELESSLY.
 *
 * A fresh {@link BitcoinLikeWallet} is created per call (imported from `@ledgerhq/wallet-btc/wallet`
 * so wallet-btc's process-wide `getWallet()` singleton is never touched), with its own in-memory
 * storage. The account is generated from the xpub + derivation path, then synced by walking the gap
 * limit against the explorer. Nothing persists between calls, so each sync rediscovers the account
 * from scratch (incremental resumption is a later optimization — see the migration task, gap #2).
 */
export async function buildSyncedAccount(
  currencyId: string,
  xpub: string,
  derivationPath: string | undefined,
): Promise<WalletBtcAccount> {
  const { rootPath, accountIndex, derivationMode } = deriveAccountMeta(derivationPath);
  const network = getCryptoCurrencyById(currencyId).isTestnetFor ? "testnet" : "mainnet";

  const wallet = new BitcoinLikeWallet(log);
  const account = await wallet.generateAccount(
    {
      xpub,
      path: rootPath,
      index: accountIndex,
      currency: currencyId as unknown as Currency,
      network,
      derivationMode,
    },
    walletBtcCurrencyById(currencyId),
  );

  const currentBlock = await account.xpub.explorer.getCurrentBlock();
  await wallet.syncAccount(account, currentBlock?.height ?? 0);
  return account;
}
