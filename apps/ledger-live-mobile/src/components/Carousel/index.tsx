import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { TouchableOpacity, ScrollView } from "react-native";
import { useDispatch } from "react-redux";
import { Flex } from "@ledgerhq/native-ui";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";
import { setCarouselVisibility } from "../../actions/settings";
import { track } from "../../analytics";
import { getDefaultSlides, SLIDES, WIDTH } from "./shared";

const DismissCarousel = styled(TouchableOpacity)`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
`;

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

type CarouselCardProps = {
  id: string;
  children: React.ReactNode;
  onHide: (_: string) => void;
  index?: number;
};

const CarouselCard = ({ id, children, onHide, index }: CarouselCardProps) => (
  <Flex key={`container_${id}`} mr={6} ml={index === 0 ? 6 : 0}>
    {children}
    <DismissCarousel hitSlop={hitSlop} onPress={() => onHide(id)}>
      <CloseMedium size={16} color="neutral.c70" />
    </DismissCarousel>
  </Flex>
);

// TODO : make it generic in the ui
const CarouselCardContainer = ({
  id,
  children,
  onHide,
  index,
}: CarouselCardProps) => (
  <CarouselCard id={id} index={index} onHide={onHide}>
    {children}
  </CarouselCard>
);

type Props = {
  cardsVisibility: boolean[];
};

const Carousel = ({ cardsVisibility }: Props) => {
  const dispatch = useDispatch();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPositionX, setCurrentPositionX] = useState(0);

  const slides = useMemo(
    () =>
      getDefaultSlides().filter((slide: any) => {
        if (!cardsVisibility[slide.id]) {
          return false;
        }
        if (slide.start && slide.start > new Date()) {
          return false;
        }
        if (slide.end && slide.end < new Date()) {
          return false;
        }
        return true;
      }),
    [cardsVisibility],
  );

  const onHide = useCallback(
    cardId => {
      const slide = SLIDES.find(slide => slide.name === cardId);
      if (slide) {
        track("button_clicked", {
          button: "Close Card",
          url: slide.url,
        });
      }
      dispatch(setCarouselVisibility({ ...cardsVisibility, [cardId]: false }));
    },
    [dispatch, cardsVisibility],
  );

  const onScrollEnd = useCallback(event => {
    setCurrentPositionX(
      event.nativeEvent.contentOffset.x +
        event.nativeEvent.layoutMeasurement.width,
    );
  }, []);

  const onScrollViewContentChange = useCallback(
    contentWidth => {
      // 264px = CarouselCard width + padding
      if (currentPositionX > contentWidth) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    },
    [currentPositionX],
  );

  if (!slides.length) {
    // No slides or dismissed, no problem
    return null;
  }

  return (
    <ScrollView
      horizontal
      ref={scrollViewRef}
      onMomentumScrollEnd={onScrollEnd}
      onContentSizeChange={onScrollViewContentChange}
      showsHorizontalScrollIndicator={false}
      snapToInterval={WIDTH + 16}
      decelerationRate={"fast"}
    >
      {slides.map(({ id, Component }, index) => (
        <CarouselCardContainer
          key={id + index}
          id={id}
          index={index}
          onHide={onHide}
        >
          <Component key={id} />
        </CarouselCardContainer>
      ))}
    </ScrollView>
  );
};

export default memo<Props>(Carousel);
