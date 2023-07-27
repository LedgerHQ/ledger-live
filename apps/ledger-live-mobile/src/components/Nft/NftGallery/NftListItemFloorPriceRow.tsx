import { Flex, Text } from "@ledgerhq/native-ui";
import React, { memo } from "react";

import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import CurrencyIcon from "../../CurrencyIcon";
import Skeleton from "../../Skeleton";
import CurrencyUnitValue from "../../CurrencyUnitValue";
import CounterValue from "../../CounterValue";
import useFloorPrice from "../../../hooks/useFloorPrice";

type Props = {
  nft: ProtoNFT;
  onPress?: (nft: ProtoNFT, nftMetadata?: NFTMetadata) => void;
  onLongPress?: () => void;
  selectable?: boolean;
  isSelected?: boolean;
};

const NftListItemFloorPriceRow = ({ nft }: Props) => {
  const { floorPriceLoading, floorPriceCurrency, currency, floorPrice } = useFloorPrice(nft);
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
        <Skeleton loading={floorPriceLoading} height={13} width={35} borderRadius={4} my={1}>
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
        <Skeleton loading={floorPriceLoading} height={13} width={60} borderRadius={4} my={1}>
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
                <CounterValue currency={currency} value={floorPrice} joinFragmentsSeparator="" />
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
