import { InformativeCard } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { memo, useEffect, useState } from "react";
import { FlatList } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import styled, { useTheme } from "styled-components/native";
import Skeleton from "../../components/Skeleton";
import { ScreenName } from "../../const";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import { LearnContentCard } from "../../dynamicContent/types";

const keyExtractor = (item: LearnContentCard) => item.id;

function LearnSection() {
  const { learnCards, trackContentCardEvent } = useDynamicContent();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 750);
  }, []);

  const renderItem = ({ item: card }: { item: LearnContentCard }) => {
    return (
      <Skeleton loading={isLoading} height="85px" m="16px" borderRadius="8px">
        <Container
          underlayColor={colors.neutral.c30}
          onPress={() => {
            trackContentCardEvent("contentcard_clicked", {
              screen: ScreenName.Learn,
              campaign: card.id,
              link: card.link,
            });
            navigation.navigate(ScreenName.LearnWebView, {
              uri: card.link,
            });
          }}
        >
          <InformativeCard
            imageUrl={card.image}
            tag={card.tag}
            title={card.title}
          />
        </Container>
      </Skeleton>
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

const Container = styled(TouchableHighlight)`
  padding: 16px;
`;

export default memo(LearnSection);
