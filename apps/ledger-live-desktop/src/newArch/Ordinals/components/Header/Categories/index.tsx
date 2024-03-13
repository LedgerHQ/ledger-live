import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import BarTabs from "@ledgerhq/react-ui/components/tabs/Bar";

type Props = {
  changeCategorySelected: (categorySelectedIndex: number) => void;
  categories: any;
};

const Categories = ({ changeCategorySelected, categories }: Props) => {
  return (
    <Flex>
      <BarTabs initialActiveIndex={0} onTabChange={changeCategorySelected}>
        {categories.map(category => (
          <Text key={category.value} color="inherit" variant="small">
            {t(category.title)}
          </Text>
        ))}
      </BarTabs>
    </Flex>
  );
};

export default Categories;
