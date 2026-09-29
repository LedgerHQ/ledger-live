import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import { AccountIdSchema } from "@domain/entity-account";
import { findCryptoCurrencyById, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { AccountBalanceSchema, type AccountBalance } from "@domain/entity-account-balance";
import { AccountOperationSchema, type AccountOperation } from "@domain/entity-account-operations";
import type { AccountDataSource, AccountRef } from "@features/platform-account-data";
import { getCoinModuleApi } from "../bridge/generic-coin-framework/api/index";
import { buildContext } from "../bridge/generic-coin-framework/api/context";
import { getBridgeApi } from "../bridge/generic-coin-framework/bridge";
import { getEnabledGenericCoinFrameworkFamilies } from "../bridge/generic-coin-framework/genericCoinFrameworkFamilies";

export type CoinModuleSourceConfig = {
  blacklistedTokenIds?(): string[];
  supportedFamilies?(): Iterable<string>;
};

// Duplicated on purpose, not imported from the legacy account helpers: this source stands alone.
// Same format as the legacy token account id, or the two sources would disagree on the same row.
const safeEncodeTokenId = (tokenId: string): string =>
  encodeURIComponent(tokenId).replace(/-/g, "~!dash!~").replace(/_/g, "~!underscore!~");
const tokenAccountId = (accountId: string, tokenId: string): string =>
  `${accountId}+${safeEncodeTokenId(tokenId)}`;

const FEE_INCLUDED_TYPES: ReadonlySet<string> = new Set([
  "OUT",
  "FEES",
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
]);

const nonNegative = (value: bigint): string => (value < 0n ? 0n : value).toString();

const stringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every(item => typeof item === "string") ? value : undefined;

/** Direct coin-module reads: an address in, rows out. No account object, no sync. */
export function createCoinModuleSource(config: CoinModuleSourceConfig = {}): AccountDataSource {
  const {
    blacklistedTokenIds = () => [],
    supportedFamilies = getEnabledGenericCoinFrameworkFamilies,
  } = config;
  const families = new Set(supportedFamilies());

  const loadCurrency = async (currencyId: string) => {
    const currency = getCryptoCurrencyById(currencyId);
    const [api, bridgeApi] = await Promise.all([
      getCoinModuleApi(currency.id, "local"),
      getBridgeApi(currency, currency.family),
    ]);
    return { currency, api, bridgeApi, context: buildContext(currency.id) };
  };

  // A token that cannot be resolved, or that the user hides, is not part of the account.
  const resolveToken = async (
    bridgeApi: Awaited<ReturnType<typeof getBridgeApi>>,
    asset: AssetInfo,
  ) => {
    const token = await bridgeApi.getTokenFromAsset?.(asset);
    return token && !blacklistedTokenIds().includes(token.id) ? token : undefined;
  };

  return {
    id: "coin-module",

    supports: ref => {
      const family = findCryptoCurrencyById(ref.currencyId)?.family;
      return family !== undefined && families.has(family);
    },

    async getBalances(ref: AccountRef): Promise<AccountBalance[]> {
      const { api, bridgeApi, context } = await loadCurrency(ref.currencyId);
      const balances = await api.getBalance(context, ref.address, bridgeApi.balanceOptions);
      const at = new Date().toISOString();
      const row = (
        accountId: string,
        assetId: string,
        { value, locked }: Pick<Balance, "value" | "locked">,
        parentId?: string,
      ) =>
        AccountBalanceSchema.parse({
          accountId,
          assetId,
          balance: value.toString(),
          spendableBalance: nonNegative(value - (locked ?? 0n)),
          ...(parentId ? { parentId } : {}),
          at,
        });

      const native = balances.find(balance => balance.asset.type === "native");
      const tokenRows = await Promise.all(
        balances
          .filter(balance => balance.asset.type !== "native")
          .map(async balance => {
            const token = await resolveToken(bridgeApi, balance.asset);
            if (!token) return [];
            return [row(tokenAccountId(ref.accountId, token.id), token.id, balance, ref.accountId)];
          }),
      );
      return [row(ref.accountId, ref.currencyId, native ?? { value: 0n }), ...tokenRows.flat()];
    },

    async getOperations(ref, { cursor, limit }) {
      const { api, bridgeApi, context } = await loadCurrency(ref.currencyId);
      const page = await api.listOperations(context, ref.address, {
        minHeight: 0,
        cursor,
        limit,
        order: "desc",
      });

      const rows = await Promise.all(
        page.items.map(async (core): Promise<AccountOperation[]> => {
          const isNative = core.asset.type === "native";
          const token = isNative ? undefined : await resolveToken(bridgeApi, core.asset);
          if (!isNative && !token) return [];

          const accountId = token
            ? tokenAccountId(ref.accountId, token.id)
            : AccountIdSchema.parse(ref.accountId);
          const fees = core.tx.fees;
          const failed = core.tx.failed;
          const feesIncluded = isNative && FEE_INCLUDED_TYPES.has(core.type);
          const value = failed ? fees : feesIncluded ? core.value + fees : core.value;
          return [
            AccountOperationSchema.parse({
              id: `${accountId}-${core.tx.hash}-${core.type}`,
              accountId,
              assetId: token ? token.id : ref.currencyId,
              hash: core.tx.hash,
              type: core.type,
              value: value.toString(),
              fee: fees.toString(),
              senders: stringArray(core.details?.parentSenders) ?? core.senders,
              recipients: stringArray(core.details?.parentRecipients) ?? core.recipients,
              blockHeight: core.tx.block.height ?? null,
              date: core.tx.date.toISOString(),
              ...(failed ? { hasFailed: true } : {}),
            }),
          ];
        }),
      );

      const nextCursor = page.next || undefined;
      return {
        operations: rows.flat(),
        ...(nextCursor === undefined ? {} : { nextCursor }),
        complete: nextCursor === undefined,
      };
    },
  };
}
