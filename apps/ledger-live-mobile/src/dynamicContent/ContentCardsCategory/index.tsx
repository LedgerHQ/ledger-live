import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { CategoryContentCard, BrazeContentCard } from "../types";
import Header from "./Header";
import Layout from "./Layout";

type Props = {
  category: CategoryContentCard;
  categoryContentCards: BrazeContentCard[];
};

const ContentCardsCategory = ({ category, categoryContentCards }: Props) => {
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
