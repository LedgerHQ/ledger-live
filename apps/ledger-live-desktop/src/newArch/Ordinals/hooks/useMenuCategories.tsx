import React, { useState } from "react";
import { Collectibles } from "~/renderer/screens/nft/Collectibles";

const categories = [
  {
    value: "inscriptions",
    title: "account.ordinals.categories.inscriptions",
    Component: () => <Collectibles />,
  },
  {
    value: "rareSats",
    title: "account.ordinals.categories.rareSats",
    Component: () => <Collectibles />,
  },
];

const useMenuCategories = () => {
  const [category, setCategory] = useState(categories[0]);
  console.log("cat", category.title);

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
