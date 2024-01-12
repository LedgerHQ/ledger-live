import React, { useCallback, memo } from "react";
import { FlatList } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import RingChart from "./RingChart";
import { useDistribution } from "~/actions/general";
import DistributionCard, { DistributionItem } from "./DistributionCard";
import { TrackScreen } from "~/analytics";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { normalize } from "~/helpers/normalizeSize";

const Container = styled(Flex).attrs({
  paddingVertical: 20,
  flex: 1,
})``;

const AssetWrapperContainer = styled(Flex).attrs({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
})``;

const size = normalize(150);

function Allocation() {
  const distribution = useDistribution({ showEmptyAccounts: true });
  const { colors } = useTheme();
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item }: { item: DistributionItem; index: number }) => <DistributionCard item={item} />,
    [],
  );

  return (
    <Container alignItems="center">
      <Flex px={6}>
        <Flex>
          <RingChart size={size} data={distribution.list} colors={colors} />
        </Flex>
        <AssetWrapperContainer pointerEvents="none">
          <Text variant="h1" fontWeight="medium" color="neutral.c100">
            {distribution.list.length}
          </Text>
          <Text variant="body" fontWeight="medium" color="neutral.c80">
            {t("distribution.assets", { count: distribution.list.length })}
          </Text>
        </AssetWrapperContainer>
      </Flex>
      <FlatList
        data={distribution.list}
        renderItem={renderItem}
        keyExtractor={item => item.currency.id}
        style={{ width: "100%" }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
      <TrackScreen category="Analytics" name="Allocation" />
    </Container>
  );
}

export default withDiscreetMode(memo(Allocation));
