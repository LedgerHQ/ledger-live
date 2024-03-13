import React, { useState } from "react";
import { Inscriptions } from "../components/Inscriptions";
import { RareSats } from "../components/RareSats";

const categories = [
  {
    value: "inscriptions",
    title: "account.ordinals.categories.inscriptions",
    Component: ({ layout }: { layout: string }) => <Inscriptions layout={layout} />,
  },
  {
    value: "rareSats",
    title: "account.ordinals.categories.rareSats",
    Component: ({ layout }: { layout: string }) => <RareSats layout={layout} />,
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
