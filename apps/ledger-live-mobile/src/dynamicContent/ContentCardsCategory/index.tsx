import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { CategoryContentCard, BrazeContentCard } from "../types";
import Header from "./Header";
import Layout from "./Layout";
import { InViewContextProvider } from "~/newArch/contexts/InViewContext";

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
        centered={category.centeredText}
      />
      <InViewContextProvider>
        <Layout category={category} cards={categoryContentCards} />
      </InViewContextProvider>
    </Flex>
  );
};

export default ContentCardsCategory;
