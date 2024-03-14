import React, { useState } from "react";
import { Inscriptions } from "../components/Inscriptions";
import { RareSats } from "../components/RareSats";
import { Category } from "../types/Categories";

const categories: Category[] = [
  {
    value: "inscriptions",
    title: "account.ordinals.categories.inscriptions",
    Component: ({ layout, account }) => <Inscriptions layout={layout} account={account} />,
  },
  {
    value: "rareSats",
    title: "account.ordinals.categories.rareSats",
    Component: ({ account }) => <RareSats account={account} />,
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
