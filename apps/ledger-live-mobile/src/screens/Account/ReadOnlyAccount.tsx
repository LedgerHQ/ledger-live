import React from "react";
import { FlatList } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";

import { TAB_BAR_SAFE_HEIGHT } from "../../components/TabBar/TabBarSafeAreaView";
import ReadOnlyAccountGraphCard from "../../components/ReadOnlyAccountGraphCard";
import ReadOnlyFabActions from "../../components/ReadOnlyFabActions";
import GradientContainer from "../../components/GradientContainer";
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
  const { t } = useTranslation();

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
    <Box mt={8}>
      <GradientContainer containerStyle={{ marginHorizontal: 16 }}>
        <Flex
          flex={1}
          px={10}
          py={11}
          alignItems="center"
          justifyContent="center"
        >
          <Text
            variant="large"
            fontWeight="semiBold"
            color="neutral.c100"
            textAlign="center"
          >
            {t("account.readOnly.noTransaction.title")}
          </Text>
          <Text
            variant="small"
            fontWeight="medium"
            color="neutral.c70"
            textAlign="center"
            mt={3}
          >
            <Trans
              i18nKey={"account.readOnly.noTransaction.title"}
              values={currency.name}
            />
          </Text>
        </Flex>
      </GradientContainer>
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
