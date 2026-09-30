import { useEffect, useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import { useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import type {
  SponsoredCoinApi,
  SponsoredFeeAsset,
  SponsoredFeeQuote,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { findFeeTokenAccount } from "../utils/sponsoredFeeAsset";

type UseSponsoredFeeParams = Readonly<{
  mainAccount: Account | null;
  seam: SponsoredCoinApi | null;
  intent: unknown;
}>;

type UseSponsoredFeeResult = Readonly<{
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

export function useSponsoredFee({
  mainAccount,
  seam,
  intent,
}: UseSponsoredFeeParams): UseSponsoredFeeResult {
  const flagEnabled = useFeature("gasSponsorship")?.enabled === true;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const nativeCurrency = mainAccount?.currency ?? null;

  const [available, setAvailable] = useState(false);
  const [quote, setQuote] = useState<SponsoredFeeQuote | null>(null);
  const [feeAsset, setFeeAsset] = useState<SponsoredFeeAsset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    if (!flagEnabled || !seam) {
      setAvailable(false);
      setFeeAsset(null);
      setQuote(null);
      setLoading(false);
      return;
    }

    // Intent rebuilds after every edit: keep `available` sticky so the user's selection isn't reverted.
    if (intent == null) {
      setQuote(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setQuote(null);

    (async () => {
      let options: Awaited<ReturnType<typeof seam.listFeeOptions>>;
      try {
        options = await seam.listFeeOptions(intent);
      } catch {
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
      } catch {
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
  }, [flagEnabled, seam, intent]);

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
