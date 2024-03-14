import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import { Category } from "~/newArch/Ordinals/types/Categories";
import { neutral, primary, Element } from "../utils";

type Props = {
  changeCategorySelected: (categorySelectedIndex: number) => void;
  categories: Category[];
  activeCategory: Category;
};

const Categories = ({ changeCategorySelected, categories, activeCategory }: Props) => {
  return (
    <Flex
      py={2}
      px={3}
      backgroundColor="opacityDefault.c05"
      borderRadius={32}
      justifyContent="space-between"
    >
      {categories.map((category, index: number) => (
        <Element
          alignItems="center"
          onClick={() => changeCategorySelected(index)}
          key={category.title}
          ml={index === 0 ? 0 : 2}
        >
          <Label
            color={category.value === activeCategory.value ? primary : neutral}
            text={t(category.title)}
          />
        </Element>
      ))}
    </Flex>
  );
};

export default Categories;

function Label({ color, text }: { color: string; text: string }) {
  return (
    <Text variant="small" fontWeight="semiBold" color={color}>
      {t(text)}
    </Text>
  );
}
