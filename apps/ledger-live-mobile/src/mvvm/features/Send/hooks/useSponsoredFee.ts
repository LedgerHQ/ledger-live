import { useEffect, useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import { useFeature } from "@features/platform-feature-flags";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import {
  getSponsoredCoinApi,
  SPONSORED_FEE_OPTION_ID,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";

export type SponsoredFeeQuote = { value: bigint; originalValue: bigint; savings: bigint };

type UseSponsoredFeeParams = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  intent: unknown;
}>;

type UseSponsoredFeeResult = Readonly<{
  available: boolean;
  quote: SponsoredFeeQuote | null;
  savingsFiat: BigNumber | null;
  feeCurrencyTicker: string;
  loading: boolean;
}>;

const SEAM_KIND = "local";

export function useSponsoredFee({
  account,
  parentAccount,
  intent,
}: UseSponsoredFeeParams): UseSponsoredFeeResult {
  const flagEnabled = useFeature("gasSponsorship")?.enabled === true;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
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
    setAvailable(false);
    setQuote(null);

    (async () => {
      const network = mainAccount.currency.id;
      let seam: Awaited<ReturnType<typeof getSponsoredCoinApi>>;
      try {
        seam = await getSponsoredCoinApi(network, SEAM_KIND);
      } catch {
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
