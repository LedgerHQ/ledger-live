import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import LogContentCardWrapper from "LLM/features/DynamicContent/components/LogContentCardWrapper";
import { CategoryContentCard, ContentCardLocation, BrazeContentCard } from "../types";
import Header from "./Header";
import Layout from "./Layout";

type Props = {
  category: CategoryContentCard;
  categoryContentCards: BrazeContentCard[];
};

const ContentCardsCategory = ({ category, categoryContentCards }: Props) => {
  const isTopWallet = category.location === ContentCardLocation.TopWallet;
  return (
    <LogContentCardWrapper id={category.id} location={category.location}>
      <Flex mt={isTopWallet ? 24 : 0}>
        <Header
          title={category.title}
          description={category.description}
          cta={category.cta}
          link={category.link}
          centered={category.centeredText}
        />
        <Layout category={category} cards={categoryContentCards} />
      </Flex>
    </LogContentCardWrapper>
  );
};

export default ContentCardsCategory;
