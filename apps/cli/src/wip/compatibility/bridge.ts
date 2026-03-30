// Bridge adapter: connects the legacy live-common Account stack to the clean CLI models.

import { BigNumber } from "bignumber.js";
import { Observable, lastValueFrom } from "rxjs";
import type { Subscription } from "rxjs";
import { filter, map, reduce } from "rxjs/operators";
import { decodeAccountId, emptyHistoryCache } from "@ledgerhq/live-common/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
// FYI: importing this stack imports a LOT of coins into the project.
import { getAccountBridge, getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import {
  asDerivationMode,
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type { Account, DerivationMode } from "@ledgerhq/types-live";
import { BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import type { AccountDescriptor, Balance, Operation } from "../models";

export class BridgeAdapter {
  private static readonly SYNC_CONFIG: { paginationConfig: object; blacklistedTokenIds: string[] } =
    { paginationConfig: {}, blacklistedTokenIds: [] };

  private static readonly cache = (() => {
    const data: Record<string, unknown> = {};
    return makeBridgeCacheSystem({
      saveData(c, d) {
        data[c.id] = d;
        return Promise.resolve();
      },
      getData(c) {
        return Promise.resolve(data[c.id]);
      },
    });
  })();

  discoverAccounts(currencyId: string, deviceId: string): Observable<AccountDescriptor> {
    const currency = getCryptoCurrencyById(currencyId);
    return new Observable(subscriber => {
      let sub: Subscription | null = null;
      let torn = false;
      BridgeAdapter.cache.prepareCurrency(currency).then(
        () => {
          if (torn) return;
          sub = getCurrencyBridge(currency)
            .scanAccounts({ currency, deviceId, syncConfig: BridgeAdapter.SYNC_CONFIG })
            .pipe(
              filter((e): e is { type: "discovered"; account: Account } => e.type === "discovered"),
              map(e => this.toDescriptor(e.account)),
            )
            .subscribe(subscriber);
        },
        err => { if (!torn) subscriber.error(err); },
      );
      return () => { torn = true; sub?.unsubscribe(); };
    });
  }

  async getBalances(descriptor: AccountDescriptor): Promise<Balance[]> {
    const account = await this.sync(descriptor);
    const balances: Balance[] = [
      {
        assetId: account.currency.id,
        balance: BigNumberStrSchema.parse(account.balance.toFixed()),
      },
    ];
    for (const sub of account.subAccounts ?? []) {
      if (sub.type === "TokenAccount") {
        balances.push({
          assetId: sub.token.id,
          balance: BigNumberStrSchema.parse(sub.balance.toFixed()),
        });
      }
    }
    return balances;
  }

  async getOperations(descriptor: AccountDescriptor): Promise<Operation[]> {
    const account = await this.sync(descriptor);
    const ops: Operation[] = account.operations.map(op => this.mapOperation(op));
    for (const sub of account.subAccounts ?? []) {
      if (sub.type === "TokenAccount") {
        for (const op of sub.operations) ops.push(this.mapOperation(op));
      }
    }
    // ISO 8601 strings from toISOString() are UTC and lexicographically ordered — string compare is safe.
    return ops.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getFreshAddress(descriptor: AccountDescriptor): Promise<string> {
    const account = await this.sync(descriptor);
    return account.freshAddress;
  }

  private async sync(descriptor: AccountDescriptor): Promise<Account> {
    const account = this.buildAccount(descriptor);
    const bridge = getAccountBridge(account);
    await BridgeAdapter.cache.prepareCurrency(account.currency);
    return lastValueFrom(
      bridge
        .sync(account, BridgeAdapter.SYNC_CONFIG)
        .pipe(reduce((acc, updater) => updater(acc), account)),
    );
  }

  private toDescriptor(account: Account): AccountDescriptor {
    return {
      id: account.id,
      currencyId: account.currency.id,
      freshAddress: account.freshAddress,
      seedIdentifier: account.seedIdentifier,
      derivationMode: account.derivationMode,
      index: account.index,
    };
  }

  private buildAccount(descriptor: AccountDescriptor): Account {
    const { xpubOrAddress } = decodeAccountId(descriptor.id);
    const currency = getCryptoCurrencyById(descriptor.currencyId);
    const derivationMode = asDerivationMode(descriptor.derivationMode) as DerivationMode;
    const scheme = getDerivationScheme({ derivationMode, currency });
    const freshAddressPath = runDerivationScheme(scheme, currency, {
      account: descriptor.index,
      node: 0,
      address: 0,
    });
    return {
      type: "Account",
      id: descriptor.id,
      xpub: xpubOrAddress,
      seedIdentifier: descriptor.seedIdentifier,
      used: true,
      swapHistory: [],
      derivationMode,
      currency,
      index: descriptor.index,
      freshAddress: descriptor.freshAddress,
      freshAddressPath,
      creationDate: new Date(),
      lastSyncDate: new Date(0),
      blockHeight: 0,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      operationsCount: 0,
      operations: [],
      pendingOperations: [],
      balanceHistoryCache: emptyHistoryCache,
    };
  }

  private mapOperation(op: Account["operations"][number]): Operation {
    return {
      id: op.id,
      hash: op.hash,
      type: op.type,
      value: BigNumberStrSchema.parse(op.value.toFixed()),
      fee: BigNumberStrSchema.parse(op.fee.toFixed()),
      senders: op.senders,
      recipients: op.recipients,
      blockHeight: op.blockHeight ?? null,
      accountId: op.accountId,
      date: DateTimeIsoSchema.parse(op.date.toISOString()),
    };
  }
}
