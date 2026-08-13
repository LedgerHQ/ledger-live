import { z } from "zod";
import { CryptoAssetMetaSchema } from "@domain/entity-aggregated-asset";
import { InterestRateSchema } from "@domain/entity-interest-rate";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import type { RawApiResponse } from "../schema";

/*
 * `loose` on every schema: DADA is a live aggregator and adds fields. Zod's default object mode
 * strips what it does not model, which would delete a new field between the wire and the consumer.
 * Validation here checks the fields we rely on and passes the rest through untouched.
 */
const AssetSchema = CryptoAssetMetaSchema.loose();

/*
 * `fetchAt` never costs a rate: nothing reads it, so an unparseable timestamp is discarded on its
 * own rather than taking a usable APY with it. The entity types it optional for the same reason.
 */
const RateSchema = InterestRateSchema.loose().extend({
  fetchAt: DateTimeIsoSchema.optional().catch(undefined),
});
const NetworkSchema = z.looseObject({ id: z.string(), name: z.string() });
const OrderSchema = z.looseObject({
  key: z.string(),
  order: z.string(),
  metaCurrencyIds: z.array(z.string()),
});

/**
 * No server ordering, rather than a throw, when `currenciesOrder` is unusable.
 *
 * A function, not a constant: callers merge pages by pushing into `metaCurrencyIds`, so a shared
 * instance would accumulate ids across unrelated responses.
 */
const noOrder = () => ({ key: "", order: "", metaCurrencyIds: [] });

function keepValidEntries<T>(
  collection: Record<string, unknown> | undefined,
  schema: z.ZodType<T>,
): { valid: Record<string, T>; dropped: number } {
  const valid: Record<string, T> = {};
  let dropped = 0;

  for (const [key, item] of Object.entries(collection ?? {})) {
    const parsed = schema.safeParse(item);
    if (parsed.success) valid[key] = parsed.data;
    else dropped += 1;
  }

  return { valid, dropped };
}

/**
 * Drops the entries of a DADA response that do not match their entity, keeping the rest.
 *
 * Never rejects the whole response: one unmodelled asset would otherwise blank out Market,
 * Portfolio and the asset selector at once. Drops are counted and warned about, because silent
 * data loss here looks identical to DADA simply not carrying an asset.
 *
 * `markets` and `cryptoOrTokenCurrencies` are untouched — the first has no entity to validate
 * against yet, the second is converted by `convertApiAssets` whose leniency is load-bearing.
 */
export function validateAssetsResponse(raw: RawApiResponse): RawApiResponse {
  const cryptoAssets = keepValidEntries(raw.cryptoAssets, AssetSchema);
  const interestRates = keepValidEntries(raw.interestRates, RateSchema);
  const networks = keepValidEntries(raw.networks, NetworkSchema);

  const parsedOrder = OrderSchema.safeParse(raw.currenciesOrder);

  const dropped = {
    cryptoAssets: cryptoAssets.dropped,
    interestRates: interestRates.dropped,
    networks: networks.dropped,
    currenciesOrder: parsedOrder.success ? 0 : 1,
  };

  const total = Object.values(dropped).reduce((sum, count) => sum + count, 0);
  if (total > 0) {
    const detail = Object.entries(dropped)
      .filter(([, count]) => count > 0)
      .map(([collection, count]) => `${collection}=${count}`)
      .join(" ");
    console.warn(`DADA response: dropped ${total} invalid item(s) — ${detail}`);
  }

  return {
    ...raw,
    cryptoAssets: cryptoAssets.valid,
    interestRates: interestRates.valid,
    networks: networks.valid,
    currenciesOrder: parsedOrder.success ? parsedOrder.data : noOrder(),
  };
}
