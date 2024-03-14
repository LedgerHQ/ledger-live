import React from "react";
import { Account } from "@ledgerhq/types-live";
import Header from "./components/Header";
import useMenuCategories from "./hooks/useMenuCategories";
import { Flex } from "@ledgerhq/react-ui";
import useMenuLayouts from "./hooks/useMenuLayouts";

type Props = { account: Account };

const Ordinals = ({ account }: Props) => {
  const { category, changeCategorySelected, categories } = useMenuCategories();
  const { layout } = useMenuLayouts();

  return (
    <Flex mb={40} bg="palette.background.paper" borderRadius={6} flexDirection="column">
      <Flex px={6} pt={6}>
        <Header
          categories={categories}
          changeCategorySelected={changeCategorySelected}
          activeCategory={category}
        />
      </Flex>
      <Flex flex={1} mt={6}>
        {category.Component({ layout, account })}
      </Flex>
    </Flex>
  );
};

export default Ordinals;
