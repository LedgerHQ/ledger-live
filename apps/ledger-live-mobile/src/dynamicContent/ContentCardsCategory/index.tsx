import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import useDynamicContent from "../dynamicContent";
import { CategoryContentCard } from "../types";
import Header from "./Header";
import Layout from "./Layout";

type Props = {
  category: CategoryContentCard;
};

const ContentCardsCategory = ({ category }: Props) => {
  const { mobileCards } = useDynamicContent();
  const categoryContentCards = mobileCards.filter(
    mobileCard => mobileCard.extras.categoryId === category.categoryId,
  );

  if (categoryContentCards.length === 0) return null;

  return (
    <Flex>
      <Header
        title={category.title}
        description={category.description}
        cta={category.cta}
        link={category.link}
      />
      <Layout category={category} cards={categoryContentCards} />
    </Flex>
  );
};

export default ContentCardsCategory;
