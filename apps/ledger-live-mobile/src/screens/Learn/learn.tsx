import { Flex, InformativeCard } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { memo } from "react";
import { FlatList } from "react-native";
import { ScreenName } from "../../const";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import { LearnContentCard } from "../../dynamicContent/types";

const keyExtractor = (item: LearnContentCard) => item.id;

function LearnSection() {
  const { learnCards } = useDynamicContent();
  const navigation = useNavigation();

  const renderItem = ({ item: card }: { item: LearnContentCard }) => {
    return (
      <Flex px="16px" py="12px">
        <InformativeCard
          onClickCard={() =>
            navigation.navigate(ScreenName.LearnWebView, {
              uri: card.link,
            })
          }
          imageUrl={card.image}
          tag={card.tag}
          title={card.title}
        />
      </Flex>
    );
  };

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
