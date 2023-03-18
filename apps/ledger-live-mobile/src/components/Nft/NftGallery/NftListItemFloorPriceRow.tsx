import { Flex, Text } from "@ledgerhq/native-ui";
import React, { memo, useEffect, useMemo, useState } from "react";
import {
  findCryptoCurrencyByTicker,
  getCryptoCurrencyById,
  valueFromUnit,
} from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { getFloorPrice } from "@ledgerhq/live-common/nft/index";
import { FloorPrice, NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import CurrencyIcon from "../../CurrencyIcon";
import Skeleton from "../../Skeleton";
import CurrencyUnitValue from "../../CurrencyUnitValue";
import CounterValue from "../../CounterValue";

type Props = {
  nft: ProtoNFT;
  onPress?: (nft: ProtoNFT, nftMetadata?: NFTMetadata) => void;
  onLongPress?: () => void;
  selectable?: boolean;
  isSelected?: boolean;
};

const NftListItemFloorPriceRow = ({ nft }: Props) => {
  const [floorPriceLoading, setFloorPriceLoading] = useState(true);
  const [floorPriceCurrency, setFloorPriceCurrency] = useState<
    CryptoCurrency | null | undefined
  >(null);
  const [floorPrice, setFloorPrice] = useState<BigNumber | null>(null);

  const currency = useMemo(
    () => getCryptoCurrencyById(nft.currencyId),
    [nft.currencyId],
  );

  useEffect(() => {
    let cancelled = false;
    setFloorPriceLoading(true);
    getFloorPrice(nft, currency)
      .then((result: FloorPrice | null) => {
        if (cancelled) return;
        if (result) {
          const foundFloorPriceCurrency = findCryptoCurrencyByTicker(
            result.ticker,
          );
          setFloorPriceCurrency(foundFloorPriceCurrency);
          if (foundFloorPriceCurrency) {
            setFloorPrice(
              valueFromUnit(
                new BigNumber(result.value),
                foundFloorPriceCurrency.units[0],
              ),
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

  return (
    <Flex flexDirection="row" alignItems="center">
      <CurrencyIcon currency={currency} size={16} />
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent={"space-between"}
        flex={1}
        ml={1}
      >
        <Skeleton
          loading={floorPriceLoading}
          height={13}
          width={35}
          borderRadius={4}
          my={1}
        >
          <Text
            variant="small"
            fontWeight="medium"
            color="neutral.c100"
            ellipsizeMode="tail"
            numberOfLines={1}
            flexGrow={1}
          >
            {(floorPrice || floorPrice === 0) && floorPriceCurrency ? (
              <>
                <CurrencyUnitValue
                  showCode={false}
                  unit={floorPriceCurrency.units[0]}
                  value={floorPrice}
                  dynamicSignificantDigits={4}
                />
              </>
            ) : (
              "--"
            )}
          </Text>
        </Skeleton>
        <Skeleton
          loading={floorPriceLoading}
          height={13}
          width={60}
          borderRadius={4}
          my={1}
        >
          <Text
            variant="small"
            fontWeight="medium"
            color="neutral.c80"
            ellipsizeMode="tail"
            numberOfLines={1}
            flexShrink={1}
          >
            {(floorPrice || floorPrice === 0) && floorPriceCurrency ? (
              <>
                <CounterValue
                  currency={currency}
                  value={floorPrice}
                  joinFragmentsSeparator=""
                />
              </>
            ) : (
              "--"
            )}
          </Text>
        </Skeleton>
      </Flex>
    </Flex>
  );
};

export default memo(NftListItemFloorPriceRow);
