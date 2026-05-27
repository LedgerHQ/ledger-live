import camelCase from "lodash/fp/camelCase";
import type { App } from "@ledgerhq/types-live";
import { getCryptoCurrencyById, isCurrencySupported } from "@ledgerhq/live-common/currencies/index";
import { type FeatureId, type Features, FeatureIdSchema } from "@shared/feature-flags";

/**
 * Local copy of live-common's `isAppAssociatedCurrencySupported`, signature reshaped to
 * take the resolved `Features` map directly. Lets the Manager AppsList consume the
 * Redux-backed slice without building two callbacks at the call site.
 */
export function isAppAssociatedCurrencySupported({
  app,
  features,
}: {
  app: App;
  features: Features;
}): boolean {
  if (["swap", "plugin"].includes(app.type)) return true;
  if (!app.currencyId) return false;
  if (!isCurrencySupported(getCryptoCurrencyById(app.currencyId))) return false;

  const currencyFeatureKey = camelCase(`currency_${app.currencyId}`);
  if (!FeatureIdSchema.safeParse(currencyFeatureKey).success) return true;
  return features[currencyFeatureKey as FeatureId]?.enabled !== false;
}
