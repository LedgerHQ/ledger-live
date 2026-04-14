// Alpaca adapter: high-performance balance and operation fetching.
// Skips full bridge sync — uses direct API calls instead.

import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createLocalEvmApi } from "@ledgerhq/live-common/bridge/generic-alpaca/alpaca/local/evm";
import evmBridge from "@ledgerhq/live-common/bridge/generic-alpaca/families/evm/bridge";
import type { Operation as CoreOperation } from "@ledgerhq/coin-module-framework/api/types";
import {
  extractBalance,
  adaptCoreOperationToLiveOperation,
} from "@ledgerhq/live-common/bridge/generic-alpaca/utils";
import { BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import type { AccountDescriptor, Balance, Operation } from "../models";

export type OperationsPage = {
  operations: Operation[];
  nextCursor: string | undefined;
};

type AlpacaAssetEntry = { asset: { type: string }; value: bigint };

export class AlpacaAdapter {
  async getBalances(descriptor: AccountDescriptor): Promise<Balance[]> {
    const { xpubOrAddress: address } = decodeAccountId(descriptor.id);
    const currency = getCryptoCurrencyById(descriptor.currencyId);
    const api = createLocalEvmApi(currency.id);
    // Pending better bridge API — evmBridge used as interim token resolver
    const bridgeApi = evmBridge(currency);

    const balanceRes: AlpacaAssetEntry[] = await api.getBalance(address);
    const native = extractBalance(balanceRes, "native");
    const tokenAssets = balanceRes.filter(b => b.asset.type !== "native");

    const tokenBalances = await Promise.all(
      tokenAssets.map(async ({ asset, value }) => {
        const token = await bridgeApi.getTokenFromAsset?.(asset);
        if (!token) return null;
        return { assetId: token.id, balance: BigNumberStrSchema.parse(String(value)) };
      }),
    );

    return [
      { assetId: currency.id, balance: BigNumberStrSchema.parse(String(native.value)) },
      ...tokenBalances.filter((b): b is Balance => b !== null),
    ];
  }

  async getOperations(
    descriptor: AccountDescriptor,
    options?: { cursor?: string; limit?: number },
  ): Promise<OperationsPage> {
    const { xpubOrAddress: address } = decodeAccountId(descriptor.id);
    const currency = getCryptoCurrencyById(descriptor.currencyId);
    const api = createLocalEvmApi(currency.id);

    const page = await api.listOperations(address, {
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
