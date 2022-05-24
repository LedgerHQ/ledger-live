import React from "react";
import { FlatList } from "react-native";
import { Box } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";

import { TAB_BAR_SAFE_HEIGHT } from "../../components/TabBar/TabBarSafeAreaView";
import ReadOnlyAccountGraphCard from "../../components/ReadOnlyAccountGraphCard";
import ReadOnlyFabActions from "../../components/ReadOnlyFabActions";
import { TrackScreen } from "../../analytics";

import { withDiscreetMode } from "../../context/DiscreetModeContext";

type RouteParams = {
  currencyId: string;
};

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

const analytics = (
  <TrackScreen category="Account" currency={"bitcoin"} operationsSize={0} />
);

function ReadOnlyAccount({ route }: Props) {
  const { currencyId } = route.params;
  const currency = getCryptoCurrencyById(currencyId);

  const data = [
    <Box mx={6} my={6}>
      <ReadOnlyAccountGraphCard
        currency={currency}
        valueChange={{ percentage: 0, value: 0 }}
      />
    </Box>,
    <Box py={3}>
      <ReadOnlyFabActions />
    </Box>,
    <Box mx={6} mt={8}>
      {/* Gradient box here */}
    </Box>,
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
      {analytics}
      <FlatList
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        data={data}
        renderItem={({ item }: any) => item}
        keyExtractor={(_: any, index: any) => String(index)}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

export default withDiscreetMode(ReadOnlyAccount);
