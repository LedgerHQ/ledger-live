import React, { memo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import MoodCard from "../MoodCard";
import { MOCK_MOOD_DATA } from "../../utils/constants";
import type { MoodData } from "../../types";

interface MoodSectionProps {
  readonly title?: string;
  readonly onCardPress?: (data: MoodData) => void;
}

function MoodSection({ title, onCardPress }: MoodSectionProps) {
  const { t } = useTranslation();

  return (
    <Flex>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        px={6}
        marginBottom={4}
      >
        <Text variant="small" fontWeight="semiBold" color="neutral.c70" uppercase>
          {title || t("portfolio.mood.title", { defaultValue: "Explore market" })}
        </Text>
      </Flex>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {MOCK_MOOD_DATA.map(item => (
          <Flex key={`mood-${item.level}-${item.value}`} marginRight={3}>
            <MoodCard data={item} onPress={onCardPress ? () => onCardPress(item) : undefined} />
          </Flex>
        ))}
      </ScrollView>
    </Flex>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 24,
  },
});

export default memo(MoodSection);
