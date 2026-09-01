// Coin framework adapter: high-performance balance and operation fetching.
// Skips full bridge sync — uses direct API calls instead.

import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createLocalEvmApi } from "@ledgerhq/live-common/families/evm/coinModuleApi";
import { buildContext } from "@ledgerhq/live-common/bridge/generic-coin-framework/api/context";
import {
  getAccountBalanceRows,
  type AssetBalanceRow,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";
import type { Operation as CoreOperation } from "@ledgerhq/coin-module-framework/api/types";
import { adaptCoreOperationToLiveOperation } from "@ledgerhq/live-common/bridge/generic-coin-framework/utils";
import { BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import type { AccountDescriptor, Operation } from "../models";

export type OperationsPage = {
  operations: Operation[];
  nextCursor: string | undefined;
};

export class CoinFrameworkAdapter {
  /**
   * Every asset held at the account's address, in **one** `getBalance` call — native and tokens
   * alike, whatever the family.
   *
   * Family-agnostic since the coin module comes from live-common's registry: this used to import
   * `createLocalEvmApi` and `evmBridge` directly, which is why the CLI could only read EVM
   * granularly. That was an implementation limit, not a capability one.
   */
  getBalanceRows(descriptor: AccountDescriptor): Promise<AssetBalanceRow[]> {
    const { xpubOrAddress } = decodeAccountId(descriptor.id);
    return getAccountBalanceRows({
      accountId: descriptor.id,
      currencyId: descriptor.currencyId,
      address: descriptor.freshAddress || xpubOrAddress,
    });
  }

  async getOperations(
    descriptor: AccountDescriptor,
    options?: { cursor?: string; limit?: number },
  ): Promise<OperationsPage> {
    const { xpubOrAddress: address } = decodeAccountId(descriptor.id);
    const currency = getCryptoCurrencyById(descriptor.currencyId);
    const api = createLocalEvmApi(currency.id);
    const context = buildContext(currency.id);

    const page = await api.listOperations(context, address, {
      minHeight: 0,
      cursor: options?.cursor,
      order: "desc",
      limit: options?.limit ?? 50,
    });

    const coreOps: CoreOperation[] = Array.isArray(page) ? page : (page.items ?? []);
    const nextCursor: string | undefined =
      !Array.isArray(page) && page.next != null ? String(page.next) : undefined;

    return {
      operations: coreOps.map(op => this.mapOperation(descriptor.id, descriptor.currencyId, op)),
      nextCursor,
    };
  }

  private mapOperation(accountId: string, assetId: string, op: CoreOperation): Operation {
    const live = adaptCoreOperationToLiveOperation(accountId, op);
    return {
      id: live.id,
      hash: live.hash,
      type: live.type,
      value: BigNumberStrSchema.parse(live.value.toFixed()),
      fee: BigNumberStrSchema.parse(live.fee.toFixed()),
      senders: live.senders,
      recipients: live.recipients,
      blockHeight: live.blockHeight ?? null,
      accountId: live.accountId,
      assetId,
      date: DateTimeIsoSchema.parse(live.date.toISOString()),
    };
  }
}
