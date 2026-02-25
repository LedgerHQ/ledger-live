import React, { useCallback, memo } from "react";
import { FlatList } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { LumenTextStyle, LumenViewStyle, useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useDistribution } from "~/actions/general";
import { TrackScreen } from "~/analytics";
import SafeAreaView from "~/components/SafeAreaView";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { normalize } from "~/helpers/normalizeSize";
import DistributionCard, { DistributionItem } from "./components/DistributionCard";
import RingChart from "./components/RingChart";

const size = normalize(200);

function DetailedAllocation() {
  const distribution = useDistribution({ showEmptyAccounts: true });
  const { t } = useTranslation();

  const styles = useStyleSheet(
    () => ({
      flatList: { width: "100%" },
      flatListContent: { paddingHorizontal: 16 },
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: DistributionItem }) => <DistributionCard item={item} />,
    [],
  );

  return (
    <SafeAreaView isFlex edges={["bottom"]}>
      <Box lx={Container}>
        <Box lx={BoxContainer}>
          <RingChart size={size} data={distribution.list} />
          <Box lx={RingChartContainer} pointerEvents="none">
            <Text typography="heading1" lx={Heading}>
              {distribution.list.length}
            </Text>
            <Text typography="body1" lx={Body}>
              {t("distribution.assets", { count: distribution.list.length })}
            </Text>
          </Box>
        </Box>
        <FlatList
          data={distribution.list}
          renderItem={renderItem}
          keyExtractor={item => item.currency.id}
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
        />
        <TrackScreen category="Analytics" name="Allocation" />
      </Box>
    </SafeAreaView>
  );
}

export default withDiscreetMode(memo(DetailedAllocation));

const Container: LumenViewStyle = {
  flex: 1,
  alignItems: "center",
};

const BoxContainer: LumenViewStyle = {
  paddingHorizontal: "s24",
};

const RingChartContainer: LumenViewStyle = {
  position: "absolute",
  top: "s0",
  left: "s0",
  right: "s0",
  bottom: "s0",
  justifyContent: "center",
  alignItems: "center",
};

const Heading: LumenTextStyle = {
  color: "base",
};

const Body: LumenTextStyle = {
  color: "muted",
};
