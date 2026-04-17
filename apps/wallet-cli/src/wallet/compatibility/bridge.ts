// Bridge adapter: connects the legacy live-common Account stack to the clean CLI models.

import { Observable, firstValueFrom, lastValueFrom } from "rxjs";
import type { Subscriber, Subscription } from "rxjs";
import { filter, map, reduce } from "rxjs/operators";
import { getCryptoCurrencyById, formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge, getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { accountDataToAccount } from "@ledgerhq/live-wallet/liveqr/cross";
import type { Account, SignedOperation, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import type { AccountDescriptor, Balance, Operation, SendEvent } from "../models";
import type { TransactionIntent } from "../intents";
import { parseAmountWithTicker } from "../intents/parse-amount";

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
        err => {
          if (!torn) subscriber.error(err);
        },
      );
      return () => {
        torn = true;
        sub?.unsubscribe();
      };
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
    const ops: Operation[] = [];
    for (const op of account.operations) {
      ops.push(this.mapOperation(op, account.currency.id));
      // internalOperations: internal ETH transfers from contract calls — not exposed via subAccounts
      for (const internal of op.internalOperations ?? []) {
        ops.push(this.mapOperation(internal, account.currency.id, op.id));
      }
      // subOperations: ERC-20 transfer events within this tx — already covered by the subAccounts
      // loop below (full token history), so we skip them here to avoid duplicates.
    }
    for (const sub of account.subAccounts ?? []) {
      if (sub.type === "TokenAccount") {
        const tokenId = sub.token.id;
        for (const op of sub.operations) ops.push(this.mapOperation(op, tokenId));
      }
    }
    // ISO 8601 strings from toISOString() are UTC and lexicographically ordered — string compare is safe.
    return ops.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getFreshAddress(descriptor: AccountDescriptor): Promise<string> {
    const account = await this.sync(descriptor);
    return account.freshAddress;
  }

  async verifyAddress(descriptor: AccountDescriptor, deviceId: string): Promise<string> {
    const account = await this.sync(descriptor);
    const bridge = await getAccountBridge(account);
    const result = await firstValueFrom(bridge.receive(account, { deviceId, verify: true }));
    return result.address;
  }

  async prepareSend(
    descriptor: AccountDescriptor,
    intent: TransactionIntent,
  ): Promise<{ amount: string; fees: string; recipient: string }> {
    const account = await this.sync(descriptor);
    const { recipient, amount, fees } = await this.buildValidatedTx(account, intent);
    return { recipient, amount, fees };
  }

  send(
    descriptor: AccountDescriptor,
    intent: TransactionIntent,
    deviceId: string,
    dryRun = false,
  ): Observable<SendEvent> {
    return new Observable(subscriber => {
      this.executeSend(descriptor, intent, deviceId, dryRun, subscriber).catch(err =>
        subscriber.error(err),
      );
    });
  }

  private async executeSend(
    descriptor: AccountDescriptor,
    intent: TransactionIntent,
    deviceId: string,
    dryRun: boolean,
    subscriber: Subscriber<SendEvent>,
  ): Promise<void> {
    const account = await this.sync(descriptor);
    const { recipient, amount, fees, bridge, tx } = await this.buildValidatedTx(account, intent);

    subscriber.next({ type: "prepared", recipient, amount, fees });

    let signedOperation: SignedOperation | undefined;
    await new Promise<void>((resolve, reject) => {
      bridge.signOperation({ account, transaction: tx, deviceId }).subscribe({
        next: event => {
          if (event.type === "device-streaming") {
            subscriber.next({
              type: "device-streaming",
              progress: event.progress,
              index: event.index,
              total: event.total,
            });
          } else if (event.type === "device-signature-requested") {
            subscriber.next({ type: "device-signature-requested" });
          } else if (event.type === "device-signature-granted") {
            subscriber.next({ type: "device-signature-granted" });
          } else if (event.type === "signed") {
            signedOperation = event.signedOperation;
          }
        },
        error: reject,
        complete: resolve,
      });
    });

    if (signedOperation === undefined) throw new Error("signOperation completed without a signed event");

    if (dryRun) {
      subscriber.next({ type: "dry-run" });
    } else {
      const op = await bridge.broadcast({ account, signedOperation });
      subscriber.next({ type: "broadcasted", txHash: op.hash });
    }

    subscriber.complete();
  }

  private buildTxExtras(intent: TransactionIntent, tokenAccount: TokenAccount | undefined) {
    const patch: Record<string, unknown> = {};
    if (tokenAccount) patch.subAccountId = tokenAccount.id;
    switch (intent.family) {
      case "bitcoin":
        if (intent.feePerByte) patch.feePerByte = new BigNumber(intent.feePerByte);
        if (intent.rbf != null) patch.rbf = intent.rbf;
        break;
      case "evm":
        if (intent.data) {
          const hexData = intent.data.slice(2);
          if (hexData.length > 0) patch.data = Buffer.from(hexData, "hex");
        }
        break;
      case "solana":
        if (intent.mode) patch.mode = intent.mode;
        if (intent.validator) patch.validator = intent.validator;
        if (intent.stakeAccount) patch.stakeAccountId = intent.stakeAccount;
        if (intent.memo) patch.memo = intent.memo;
        break;
    }
    return patch;
  }

  private async buildValidatedTx(account: Account, intent: TransactionIntent) {
    const bridge = await getAccountBridge(account);
    const nativeUnit = account.currency.units[0];
    const parsed = parseAmountWithTicker(intent.amount, account);
    const tokenAccount =
      parsed.assetId === account.currency.id
        ? undefined
        : (account.subAccounts ?? []).find(
            (s): s is TokenAccount => s.type === "TokenAccount" && s.token.id === parsed.assetId,
          );
    const amountUnit = tokenAccount ? tokenAccount.token.units[0] : nativeUnit;

    let tx = bridge.createTransaction(account);
    tx = bridge.updateTransaction(tx, {
      recipient: intent.recipient,
      amount: parsed.amount,
      ...this.buildTxExtras(intent, tokenAccount),
    });
    tx = await bridge.prepareTransaction(account, tx);
    const status = await bridge.getTransactionStatus(account, tx);
    const errors = Object.values(status.errors);
    if (errors.length > 0) throw errors[0];

    return {
      // formatted summary (used by prepareSend and the "prepared" event in send)
      recipient: intent.recipient,
      amount: formatCurrencyUnit(amountUnit, status.amount, { showCode: true }),
      fees: formatCurrencyUnit(nativeUnit, status.estimatedFees, { showCode: true }),
      // raw objects needed by send to proceed to signing
      bridge,
      tx,
    };
  }

  private async sync(descriptor: AccountDescriptor): Promise<Account> {
    const account = this.buildAccount(descriptor);
    const bridge = await getAccountBridge(account);
    await BridgeAdapter.cache.prepareCurrency(account.currency);
    return lastValueFrom(
      bridge
        .sync(account, BridgeAdapter.SYNC_CONFIG)
        .pipe(reduce((acc, updater) => updater(acc), account)),
    );
  }

  private toDescriptor(account: Account): AccountDescriptor {
    // Use xpubOrAddress from the encoded id — for UTXO families (bitcoin) this is the xpub,
    // which is what V1 adapters and WalletSync expect. account.seedIdentifier is the raw
    // compressed public key for bitcoin and cannot be used as an xpub.
    const { xpubOrAddress: seedIdentifier } = decodeAccountId(account.id);
    return {
      id: account.id,
      currencyId: account.currency.id,
      freshAddress: account.freshAddress,
      seedIdentifier,
      derivationMode: account.derivationMode,
      index: account.index,
    };
  }

  private buildAccount(descriptor: AccountDescriptor): Account {
    const [account] = accountDataToAccount({ ...descriptor, balance: "0", name: "" });
    return account;
  }

  private mapOperation(
    op: Account["operations"][number],
    assetId: string,
    parentId?: string,
  ): Operation {
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
      assetId,
      date: DateTimeIsoSchema.parse(op.date.toISOString()),
      ...(parentId === undefined ? {} : { parentId }),
    };
  }
}
