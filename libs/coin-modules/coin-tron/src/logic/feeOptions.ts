import type { FeeOptionMeta, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { type TronCoinConfig, type TronContext } from "../config";
import type { TronMemo, TronTxData } from "../types";
import {
  STANDARD_FEE_OPTION_ID,
  TRONIFY_FEE_OPTION_ID,
  TRONIFY_PAY_ASSET,
  TRX_CURRENCY_NAME,
  TRX_UNIT,
  tronifyPayAsset,
} from "./constants";
import { estimateFees } from "./estimateFees";
import { getEnergyProvider } from "./energyRent";
import { validateAddress } from "./validateAddress";

type TronIntent = TransactionIntent<TronMemo, TronTxData>;

// Fresh objects per call (unit included) keep returned options free of shared mutable state —
// mutating an option must never leak into the module-level constants.
const standardOption = (): FeeOptionMeta => ({
  id: STANDARD_FEE_OPTION_ID,
  feeAsset: { type: "native", name: TRX_CURRENCY_NAME, unit: { ...TRX_UNIT } },
});
const tronifyOption = (): FeeOptionMeta => ({
  id: TRONIFY_FEE_OPTION_ID,
  feeAsset: tronifyPayAsset(),
});

// Fresh array per call so a caller can't mutate a shared module-level list.
const standardOnly = (): FeeOptionMeta[] => [standardOption()];

// The default config ships the provider url and the sourceFlag arrives remotely once agreed with
// Tronify, so until then a missing or blank one is the normal state, not a misconfiguration to log.
const awaitingSourceFlag = (config: TronCoinConfig): boolean => {
  const tronify = config.energyRent?.tronify;
  const sourceFlag: unknown = tronify?.sourceFlag;
  return (
    config.energyRent?.provider === "tronify" &&
    typeof tronify?.url === "string" &&
    tronify.url.trim().length > 0 &&
    (sourceFlag === undefined || (typeof sourceFlag === "string" && sourceFlag.trim().length === 0))
  );
};

/** Fee-payment options (ADR-050 Option 3); never throws — any failure degrades to standard-only.
 * Tronify is offered only on a genuine energy shortfall, since the on-chain delivery gate reads
 * absolute energy and would otherwise risk releasing TX-C on an undelivered rental. */
export async function listFeeOptions(
  context: TronContext,
  intent: TronIntent,
): Promise<FeeOptionMeta[]> {
  try {
    // Tronify rent is paid in USDT, so it is offered on USDT transfers only, where the amount and
    // the rent draw on one balance.
    if (
      intent.type !== "send" ||
      intent.asset.type !== "trc20" ||
      intent.asset.assetReference !== TRONIFY_PAY_ASSET.assetReference
    ) {
      return standardOnly();
    }

    // `prepareTransaction` re-estimates on every change — before a recipient is entered and while the
    // user is still typing. Bail quietly until the recipient is a valid Tron address, so the estimate
    // below never throws decoding a malformed base58 (repeated try/catch + wasted estimates each keystroke).
    if (!intent.recipient || !(await validateAddress(intent.recipient, {}))) return standardOnly();

    const config = await context.config();

    // Not enabled is the normal state, not a failure — return before the gate so it isn't logged below.
    if (!config.energyRent || awaitingSourceFlag(config)) return standardOnly();

    // A malformed energyRent block (missing url, unknown provider) throws here, degrading
    // to standard-only in the catch instead of advertising an option that only fails later.
    getEnergyProvider(config);

    const standard = await estimateFees(context.logger, config, intent);
    const energyRequired = standard.parameters?.energyRequired;
    const energyAvailable = standard.parameters?.energyAvailable;
    if (
      standard.parameters?.energyEstimated !== true ||
      typeof energyRequired !== "string" ||
      typeof energyAvailable !== "string" ||
      BigInt(energyRequired) <= BigInt(energyAvailable)
    ) {
      return standardOnly();
    }

    return [tronifyOption(), standardOption()];
  } catch (err) {
    context.logger("tron/listFeeOptions", "failed, falling back to standard-only", { err });
    return standardOnly();
  }
}
