import { useEffect, useMemo, useState } from "react";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { getFloorPrice } from "@ledgerhq/live-common/nft/index";
import { FloorPrice, ProtoNFT } from "@ledgerhq/types-live";
import {
  findCryptoCurrencyByTicker,
  getCryptoCurrencyById,
  valueFromUnit,
} from "@ledgerhq/coin-framework/currencies/index";

const useFloorPrice = (nft: ProtoNFT) => {
  const [floorPriceLoading, setFloorPriceLoading] = useState(true);
  const [floorPriceCurrency, setFloorPriceCurrency] = useState<CryptoCurrency | null | undefined>(
    null,
  );
  const [floorPrice, setFloorPrice] = useState<BigNumber | null>(null);
  const currency = useMemo(() => getCryptoCurrencyById(nft.currencyId), [nft.currencyId]);

  useEffect(() => {
    let cancelled = false;
    setFloorPriceLoading(true);
    getFloorPrice(nft, currency)
      .then((result: FloorPrice | null) => {
        if (cancelled) return;
        if (result) {
          const foundFloorPriceCurrency = findCryptoCurrencyByTicker(result.ticker);
          setFloorPriceCurrency(foundFloorPriceCurrency);
          if (foundFloorPriceCurrency) {
            setFloorPrice(
              valueFromUnit(new BigNumber(result.value), foundFloorPriceCurrency.units[0]),
            );
          }
        }
      })
      .finally(() => {
        if (cancelled) return;
        setFloorPriceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nft, currency]);

  return {
    currency,
    floorPriceLoading,
    // NOTE: I don't understand why we need to find the currency from the response when we also have to pass it in
    // to make the request to beign with. I'm returning it here to keep this hook EXACTLY as it was originally written.
    floorPriceCurrency,
    floorPrice,
  };
};

export default useFloorPrice;
