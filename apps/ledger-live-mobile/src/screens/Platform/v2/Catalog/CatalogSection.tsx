import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, ScrollContainer, Text } from "@ledgerhq/native-ui";

export function CatalogSection({
  categories,
  selected,
  setSelected,
}: {
  categories: string[];
  selected: string;
  setSelected: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Flex backgroundColor="background.main">
      <Text
        variant={"h4"}
        fontWeight={"semiBold"}
        marginBottom={16}
        marginLeft={16}
      >
        {t("browseWeb3.catalog.section.categories")}
      </Text>
      <ScrollContainer
        paddingLeft={16}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {categories.map((value: string, index) => (
          <Flex
            key={index}
            marginRight={index === categories.length - 1 ? 8 : 4}
            borderBottomColor={
              value === selected ? "neutral.c100" : "neutral.c50"
            }
            borderBottomWidth={value === selected ? 3 : 0}
            paddingBottom={2}
          >
            <Text
              color={value === selected ? "neutral.c100" : "neutral.c50"}
              onPress={() => {
                setSelected(value);
              }}
              fontSize={15}
              fontWeight="semiBold"
              variant={"subtitle"}
            >
              {value}
            </Text>
          </Flex>
        ))}
      </ScrollContainer>
    </Flex>
  );
}
