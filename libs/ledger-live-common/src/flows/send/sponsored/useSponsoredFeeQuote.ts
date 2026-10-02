import { useEffect, useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { Currency } from "@domain/entity-currency";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import type {
  SponsoredCoinApi,
  SponsoredFeeAsset,
  SponsoredFeeQuote,
} from "../../../bridge/generic-coin-framework/sponsored";
import { findFeeTokenAccount } from "./feeAsset";

type UseSponsoredFeeQuoteParams = Readonly<{
  mainAccount: Account | null;
  /** Null when sponsorship is off or the network has no seam. */
  seam: SponsoredCoinApi | null;
  intent: unknown;
  /** The intent builder rejected the transaction: withdraw the option rather than wait on it. */
  intentFailed?: boolean;
  counterValueCurrency: Currency;
}>;

export type SponsoredFeeQuoteResult = Readonly<{
  available: boolean;
  quote: SponsoredFeeQuote | null;
  feeAsset: SponsoredFeeAsset | null;
  /** The sub-account the sponsored fee is paid from; null when the account holds none. */
  feeTokenAccount: TokenAccount | null;
  standardFeeFiat: BigNumber | null;
  sponsoredFeeFiat: BigNumber | null;
  /** Standard minus sponsored fee in fiat; null unless both rates exist and the saving is positive. */
  savingsFiat: BigNumber | null;
  feeCurrencyTicker: string;
  loading: boolean;
}>;

export function useSponsoredFeeQuote({
  mainAccount,
  seam,
  intent,
  intentFailed = false,
  counterValueCurrency,
}: UseSponsoredFeeQuoteParams): SponsoredFeeQuoteResult {
  const nativeCurrency = mainAccount?.currency ?? null;

  const [available, setAvailable] = useState(false);
  const [quote, setQuote] = useState<SponsoredFeeQuote | null>(null);
  const [feeAsset, setFeeAsset] = useState<SponsoredFeeAsset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    if (!seam || intentFailed) {
      setAvailable(false);
      setFeeAsset(null);
      setQuote(null);
      setLoading(false);
      return;
    }

    // Intent rebuilds after every edit: keep `available` sticky so the current pick isn't reverted.
    if (intent == null) {
      setQuote(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setQuote(null);

    void (async () => {
      let options: Awaited<ReturnType<typeof seam.listFeeOptions>>;
      try {
        options = await seam.listFeeOptions(intent);
      } catch (error) {
        log("sponsored-send", "listFeeOptions failed", { error });
        if (!ignore) {
          setAvailable(false);
          setFeeAsset(null);
          setQuote(null);
          setLoading(false);
        }
        return;
      }
      if (ignore) return;

      const sponsoredOption = options.find(option => option.id === seam.feeOptionId);
      setAvailable(!!sponsoredOption);
      setFeeAsset(sponsoredOption?.feeAsset ?? null);

      if (!sponsoredOption) {
        setQuote(null);
        setLoading(false);
        return;
      }

      try {
        const result = await seam.estimateSponsoredFeeQuote(intent);
        if (ignore) return;
        setQuote(result);
      } catch (error) {
        log("sponsored-send", "sponsored fee quote failed", { error });
        // Without a quote the native-fee error can't be waived, so Review would dead-end: withdraw the option.
        if (!ignore) {
          setAvailable(false);
          setFeeAsset(null);
          setQuote(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [seam, intent, intentFailed]);

  const feeTokenAccount = useMemo(
    () => findFeeTokenAccount(mainAccount, feeAsset),
    [mainAccount, feeAsset],
  );

  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const standardFeeFiat = useMemo(() => {
    if (!quote || !nativeCurrency) return null;
    return (
      calculateCountervalue(nativeCurrency, new BigNumber(quote.originalValue.toString())) ?? null
    );
  }, [quote, nativeCurrency, calculateCountervalue]);
  const sponsoredFeeFiat = useMemo(() => {
    if (!quote || !feeTokenAccount) return null;
    return (
      calculateCountervalue(feeTokenAccount.token, new BigNumber(quote.value.toString())) ?? null
    );
  }, [quote, feeTokenAccount, calculateCountervalue]);
  const savingsFiat = useMemo(() => {
    if (!standardFeeFiat || !sponsoredFeeFiat) return null;
    const savings = standardFeeFiat.minus(sponsoredFeeFiat);
    return savings.gt(0) ? savings : null;
  }, [standardFeeFiat, sponsoredFeeFiat]);

  return {
    available,
    quote,
    feeAsset,
    feeTokenAccount,
    standardFeeFiat,
    sponsoredFeeFiat,
    savingsFiat,
    feeCurrencyTicker: feeAsset?.unit?.code ?? "",
    loading,
  };
}
