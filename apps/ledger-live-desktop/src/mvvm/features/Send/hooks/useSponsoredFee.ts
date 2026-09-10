import { useEffect, useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import { useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import {
  getSponsoredCoinApi,
  SPONSORED_FEE_OPTION_ID,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

/** TRX-denominated savings quote for the Tronify fee nudge — mirrors the seam's own
 * `SponsoredFeeQuote` shape (bridge/generic-coin-framework/sponsored.ts) so consumers don't take a
 * dependency on that internal seam type. */
export type SponsoredFeeQuote = { value: bigint; originalValue: bigint; savings: bigint };

type UseSponsoredFeeParams = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  /** A TransactionIntent for the send; passed straight through to the seam, opaque here. */
  intent: unknown;
}>;

type UseSponsoredFeeResult = Readonly<{
  /** Flag on AND listFeeOptions advertises the tronify option for this intent. */
  available: boolean;
  /** null until loaded, or when unavailable / the quote failed to resolve. */
  quote: SponsoredFeeQuote | null;
  /** quote.savings converted to the user's counter-value currency; null when there is no quote. */
  savingsFiat: BigNumber | null;
  /** Ticker of the currency fees are actually paid in — the parent chain's (TRX), never a TRC-20
   * token's. Interpolated into fee copy so the disclaimer stays truthful if the seam ever moves off
   * TRX, without drifting the shared string for non-Tronify uses. */
  feeCurrencyTicker: string;
  loading: boolean;
}>;

const SEAM_KIND = "local";

/**
 * Availability + savings for the TRON Tronify sponsored-fee option on the current send intent.
 *
 * Gated on the `gasSponsorship` feature flag only (no persisted user-setting gate on this
 * branch yet — see LIVE-32778 / useGasSponsorshipEnabled). When the flag is off, or the family's
 * coin-module doesn't implement the sponsored-send seam (every non-TRON family), short-circuits
 * without a network call.
 */
export function useSponsoredFee({
  account,
  parentAccount,
  intent,
}: UseSponsoredFeeParams): UseSponsoredFeeResult {
  const flagEnabled = useFeature("gasSponsorship")?.enabled === true;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? null),
    [account, parentAccount],
  );
  // The seam is always TRX-denominated, so the conversion below must use the parent chain's
  // currency/unit, never a TRC-20 token's — hence getAccountCurrency(mainAccount), not
  // getAccountCurrency(account).
  const feeCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  const [available, setAvailable] = useState(false);
  const [quote, setQuote] = useState<SponsoredFeeQuote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    if (!flagEnabled) {
      setAvailable(false);
      setQuote(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Clear the prior intent's savings so a consumer never renders a stale amount while the new
    // quote is still resolving (availability stays sticky until re-resolved, to avoid nudge flicker).
    setQuote(null);

    (async () => {
      // getCoinModuleApi (and this seam) resolve by chain id, never a token's own id — the parent
      // chain currency id (mainAccount.currency.id) is what yields "tron" for a TRC-20 send.
      const network = mainAccount.currency.id;
      let seam: Awaited<ReturnType<typeof getSponsoredCoinApi>>;
      try {
        seam = await getSponsoredCoinApi(network, SEAM_KIND);
      } catch {
        // Seam resolution (coin-module load / network lookup) can reject — an infra failure, not a
        // fee fault. Degrade to not-sponsored exactly like the null-seam branch (the standard fee
        // path always works, per ADR-050), and settle loading so no spinner strands and the effect
        // leaves no unhandled rejection. Mirrors the orchestration's own getSeam `.catch` guard.
        // The deliberate no-swallow on listFeeOptions below is unaffected: that path degrades inside
        // coin-tron and never throws, so a throw there is still a real fault that must surface.
        if (!ignore) {
          setAvailable(false);
          setQuote(null);
          setLoading(false);
        }
        return;
      }
      if (ignore) return;

      if (!seam) {
        setAvailable(false);
        setQuote(null);
        setLoading(false);
        return;
      }

      // Same seam class as getSponsoredCoinApi above: coin-tron's listFeeOptions degrades to the
      // standard-only list internally, but the seam is a contract other families implement, so guard
      // the call the same way. Without this catch a throw would strand `loading` at true (the only
      // setLoading(false) past this point is unreachable) and leak an unhandled rejection from this
      // fire-and-forget effect. Degrade to not-sponsored; the standard fee path is unaffected (ADR-050).
      let options: Awaited<ReturnType<typeof seam.listFeeOptions>>;
      try {
        options = await seam.listFeeOptions(intent);
      } catch {
        if (!ignore) {
          setAvailable(false);
          setQuote(null);
          setLoading(false);
        }
        return;
      }
      if (ignore) return;

      const isAvailable = options.some(option => option.id === SPONSORED_FEE_OPTION_ID);
      setAvailable(isAvailable);

      if (!isAvailable) {
        setQuote(null);
        setLoading(false);
        return;
      }

      try {
        // estimateSponsoredFeeQuote throws for an intent that isn't an eligible TRC-20 send (no
        // recipient yet, etc.) — only called after availability is confirmed, and the throw must
        // settle to "no savings" rather than an unhandled rejection.
        const result = await seam.estimateSponsoredFeeQuote(intent);
        if (ignore) return;
        setQuote(result);
      } catch {
        if (!ignore) setQuote(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [flagEnabled, mainAccount, intent]);

  // Mirrors useFeeInfo.ts's exact useCalculate wiring (currency, raw base-unit value, disableRounding).
  const savingsCountervalue = useCalculate({
    from: feeCurrency,
    to: counterValueCurrency,
    value: quote ? Number(quote.savings) : 0,
    disableRounding: true,
  });

  const savingsFiat = useMemo(() => {
    if (!quote || savingsCountervalue === null || savingsCountervalue === undefined) return null;
    return new BigNumber(savingsCountervalue);
  }, [quote, savingsCountervalue]);

  return { available, quote, savingsFiat, feeCurrencyTicker: feeCurrency.ticker, loading };
}
