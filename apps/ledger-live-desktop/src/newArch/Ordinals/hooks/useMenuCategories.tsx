import React, { useState } from "react";
import { Text } from "@ledgerhq/react-ui";

const useMenuCategories = () => {
  const categories = [
    {
      value: "inscriptions",
      title: "account.ordinals.categories.inscriptions",
      Component: <Text>Inscriptions Component</Text>,
    },
    {
      value: "rareSats",
      title: "account.ordinals.categories.rareSats",
      Component: <Text>Rare Sats Component</Text>,
    },
  ];
  const [category, setCategory] = useState(categories[0]);

  const changeCategorySelected = (categorySelectedIndex: number) => {
    setCategory(categories[categorySelectedIndex]);
  };

  return {
    categories,
    category,
    changeCategorySelected,
  };
};

export default useMenuCategories;
