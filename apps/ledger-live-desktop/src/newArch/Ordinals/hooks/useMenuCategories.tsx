import { Text } from "@ledgerhq/react-ui";
import React, { useState } from "react";
import { RareSats } from "../components/RareSats";

const categories = [
  {
    value: "inscriptions",
    title: "account.ordinals.categories.inscriptions",
    Component: () => <Text>Salut Inscriptions</Text>,
  },
  {
    value: "rareSats",
    title: "account.ordinals.categories.rareSats",
    Component: () => <RareSats layout="grid" />,
  },
];

const useMenuCategories = () => {
  const [category, setCategory] = useState(categories[0]);

  const changeCategorySelected = (categorySelectedIndex: number) => {
    setCategory({ ...categories[categorySelectedIndex] });
  };

  return {
    categories,
    category,
    changeCategorySelected,
  };
};

export default useMenuCategories;
