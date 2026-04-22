import React, { memo } from "react";
import { TouchableOpacity } from "react-native";
import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import RingChart from "../../../../components/RingChart";
import { useAllocationsViewModel } from "./useAllocationsViewModel";

const AllocationCaption = memo(
  ({ currencyTicker, currencyColor }: { currencyTicker: string; currencyColor: string }) => {
    return (
      <Flex flexDirection="row" alignItems="center" mb={3}>
        <Flex bg={currencyColor} width={8} height={8} borderRadius={4} mr={2} />
        <Text variant="body" fontWeight="semiBold">
          {currencyTicker}
        </Text>
      </Flex>
    );
  },
);

type Props = Readonly<{
  screenName: string;
  onPress: () => void;
}>;

function Allocations({ screenName, onPress }: Props) {
  const {
    distributionListFormatted,
    allocationColumns,
    getCurrencyColorEnsureContrast,
    goToAnalyticsAllocations,
  } = useAllocationsViewModel(screenName, onPress);

  return (
    <Flex flex={1}>
      <TouchableOpacity onPress={goToAnalyticsAllocations}>
        <Flex flexDirection="row" alignItems="center">
          <Flex>
            <RingChart size={94} strokeWidth={5} data={distributionListFormatted} />
          </Flex>
          <Flex flex={1} ml={8} flexDirection="row" mt={3}>
            {allocationColumns.map(column => (
              <Flex
                key={column.map(({ currency }) => currency.id).join("-")}
                ml={column === allocationColumns[0] ? 0 : 8}
              >
                {column.map(distributionItem => (
                  <AllocationCaption
                    key={distributionItem.currency.id}
                    currencyTicker={distributionItem.currency.ticker}
                    currencyColor={getCurrencyColorEnsureContrast(distributionItem.currency)}
                  />
                ))}
              </Flex>
            ))}
          </Flex>
          <IconsLegacy.ChevronRightMedium size={24} />
        </Flex>
      </TouchableOpacity>
    </Flex>
  );
}

export default memo(Allocations);
