import { InformativeCard, Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useState } from "react";
import { FlatList } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import styled, { useTheme } from "styled-components/native";
import { TrackScreen } from "~/analytics";
import Skeleton from "~/components/Skeleton";
import { ScreenName } from "~/const";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { LearnContentCard } from "~/dynamicContent/types";

const keyExtractor = (item: LearnContentCard) => item.id;

function LearnSection() {
  const { learnCards, trackContentCardEvent } = useDynamicContent();
  const navigation = useNavigation();
  const { colors, space, radii } = useTheme();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 750);
  }, []);

  const onClickItem = useCallback(
    (card: LearnContentCard) => {
      if (!card.link) return;
      trackContentCardEvent("contentcard_clicked", {
        screen: ScreenName.Learn,
        campaign: card.id,
        link: card.link,
      });
      navigation.navigate(ScreenName.LearnWebView, {
        uri: card.link,
      });
    },
    [navigation, trackContentCardEvent],
  );

  const renderItem = ({ item: card }: { item: LearnContentCard }) => {
    return (
      <Skeleton
        loading={isLoading}
        height="85px"
        mx={`${space[6]}px`}
        my={`${space[3]}px`}
        borderRadius={`${radii[2]}px`}
      >
        <Container underlayColor={colors.neutral.c30} onPress={() => onClickItem(card)}>
          <InformativeCard imageUrl={card.image} tag={card.tag} title={card.title} />
        </Container>
      </Skeleton>
    );
  };

  return (
    <Flex>
      <TrackScreen category="Learn" />
      <FlatList
        data={learnCards}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </Flex>
  );
}

const Container = styled(TouchableHighlight)`
  padding-left: ${props => props.theme.space[6]};
  padding-right: ${props => props.theme.space[6]};
  padding-top: ${props => props.theme.space[3]};
  padding-bottom: ${props => props.theme.space[3]};
`;

export default memo(LearnSection);
