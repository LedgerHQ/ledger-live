import { Flex, InformativeCard } from "@ledgerhq/native-ui";
import React, { memo } from "react";
import { FlatList } from "react-native";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import { LearnContentCard } from "../../dynamicContent/types";

const keyExtractor = (item: LearnContentCard) => item.id;

const renderItem = ({ item: card }: { item: LearnContentCard }) => {
  return (
    <Flex px="16px" py="12px">
      <InformativeCard
        onClickCard={() => console.log("Click")}
        imageUrl={card.image}
        tag={card.tag}
        title={card.title}
      />
    </Flex>
  );
};

function LearnSection() {
  const { learnCards } = useDynamicContent();

  return (
    <FlatList
      data={learnCards}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default memo(LearnSection);
