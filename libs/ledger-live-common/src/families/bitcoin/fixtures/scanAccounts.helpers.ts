import { lastValueFrom, toArray } from "rxjs";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { mockDeviceWithAPDUs, releaseMockDevice } from "../../../__tests__/test-helpers/mockDevice";
import type { BitcoinAccount, BitcoinAccountRaw } from "@ledgerhq/coin-bitcoin/types";
import { fromAccountRaw, toAccountRaw } from "../../../account";
import { bridge } from "../setup";
import { SCAN_ACCOUNTS_APDUS } from "./scanAccounts.apdus";

const SYNC_CONFIG = { paginationConfig: {}, blacklistedTokenIds: [] };

export const scanWithRecordedDevice = async (currencyId: string): Promise<Account[]> => {
  const deviceId = await mockDeviceWithAPDUs(SCAN_ACCOUNTS_APDUS[currencyId]);
  const events = await lastValueFrom(
    bridge.currencyBridge
      .scanAccounts({
        currency: getCryptoCurrencyById(currencyId),
        deviceId,
        syncConfig: SYNC_CONFIG,
      })
      .pipe(toArray()),
  );
  releaseMockDevice(deviceId);
  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account);
};

export const isBitcoinAccount = (account: Account): account is BitcoinAccount => {
  return "bitcoinResources" in account;
};

export const restoreBitcoinAccount = async (account: Account): Promise<BitcoinAccount> => {
  const restored = await fromAccountRaw(await toAccountRaw(account));
  if (!isBitcoinAccount(restored)) {
    throw new Error("the restored account has no bitcoin resources");
  }
  return restored;
};

export const restoreFromXpubOnly = async (account: Account): Promise<BitcoinAccount> => {
  const raw = await toAccountRaw(account);
  const xpubOnly: BitcoinAccountRaw = {
    ...raw,
    operations: [],
    pendingOperations: [],
    balance: "0",
    spendableBalance: "0",
    blockHeight: 0,
    lastSyncDate: "",
    bitcoinResources: { utxos: [] },
  };
  const restored = await fromAccountRaw(xpubOnly);
  if (!isBitcoinAccount(restored)) {
    throw new Error("the restored account has no bitcoin resources");
  }
  return restored;
};
