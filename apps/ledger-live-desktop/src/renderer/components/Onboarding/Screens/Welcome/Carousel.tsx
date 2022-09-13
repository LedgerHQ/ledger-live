import React, { useState, useCallback, useEffect, useRef } from "react";

import { Flex, Icons, Logos, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { TransitionGroup } from "react-transition-group";
import TransitionSlide from "@ledgerhq/react-ui/components/transitions/TransitionSlide";

const Wrapper = styled(Flex).attrs({
  flexDirection: "column",
  alignItems: "center",
  position: "relative",
  flex: 1,
  justifyContent: "center",
  width: "400px",
  margin: "auto",
  height: "100%",
})`
  text-align: center;
`;

const SlideLogo = styled(Flex)<{ image?: string }>`
  min-height: 350px;
  min-width: 350px;
  margin-bottom: 40px;
  background: url(${p => p.image}) no-repeat;
  background-position: center center;
  background-size: contain;
  z-index: ${p => p.theme.zIndexes[8]};
`;

export type SlideProps = {
  title: string;
  description: string;
  image?: string;
};

const Slide = ({ title, description, image }: SlideProps): React.ReactElement => {
  return (
    <Wrapper>
      <SlideLogo key={"key"} image={image} />
      <Text mb={12} variant="h3" color="palette.constant.black">
        {title}
      </Text>
      <Text mb={76} variant="body" color="palette.constant.black" whiteSpace="pre-line">
        {description}
      </Text>
    </Wrapper>
  );
};

const CarouselWrapper = styled(Flex).attrs({
  flex: 1,
  height: "700px",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  margin: "44px",
  position: "relative",
})``;

const Controllers = styled(Flex).attrs({
  position: "absolute",
  flexDirection: "row",
  right: 5,
  bottom: 4,
  columnGap: 4,
  color: "constant.black",
})`
  > div {
    &:hover {
      opacity: 0.5;
    }
  }
`;

const Bullets = styled(Flex).attrs({
  left: 8,
  bottom: 8,
  columnGap: 2,
  position: "absolute",
  flexDirection: "row",
})<{ active?: number }>`
  > div {
    position: relative;
    height: ${p => p.theme.space[1]}px;
    width: ${p => p.theme.space[8]}px;
    background: ${p => p.theme.colors.palette.constant.black};
    opacity: 0.3;
    &:hover {
      opacity: 1;
    }

    &:nth-child(${p => p.active}) {
      opacity: 1;
      &:hover {
        opacity: 0.75;
      }
    }

    ::after {
      content: "";
      position: absolute;
      top: -${p => p.theme.space[4]}px;
      height: ${p => p.theme.space[7]}px;
      width: 100%;
    }
  }
`;

export type Props = {
  timeout?: number;
  queue: SlideProps[];
};

const DEFAULT_TIMEOUT = 7000;
const Carousel = ({ timeout = DEFAULT_TIMEOUT, queue }: Props): React.ReactElement | null => {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const [direction, setDirection] = useState("right");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const childFactory = useCallback(child => React.cloneElement(child, { direction }), [direction]);

  const wrappedSetIndex = useCallback(
    newIndex => {
      setDirection(newIndex > index ? "left" : "right");
      setIndex(newIndex);
    },
    [index],
  );

  const onSlide = useCallback(
    (direction = "left") => {
      setDirection(direction);
      const i = index + (direction === "right" ? -1 : 1);
      setIndex(i < 0 ? queue.length - 1 : i >= queue.length ? 0 : i);
    },
    [index, queue],
  );
  const onPrevious = useCallback(() => onSlide("right"), [onSlide]);
  const onNext = useCallback(() => onSlide("left"), [onSlide]);

  const onMouseEnter = useCallback(() => setPaused(true), []);
  const onMouseLeave = useCallback(() => setPaused(false), []);

  useEffect(() => {
    // Nb we pause automatic transitions when the mouse is within the carousel.
    // Override passed timeout if lower than 1000ms
    const _timeout = timeout < 1000 ? DEFAULT_TIMEOUT : timeout;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!paused) intervalRef.current = setInterval(onSlide, _timeout);
  }, [onSlide, paused, timeout]);

  if (!queue?.length) return null;

  return (
    <CarouselWrapper onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <TransitionGroup component={null} childFactory={childFactory}>
        <TransitionSlide key={index} direction={direction}>
          <Slide {...queue[index]} />
        </TransitionSlide>
      </TransitionGroup>

      <Bullets active={index + 1}>
        {queue.map((_, i) => (
          <div key={`bullet_${i}`} onClick={() => wrappedSetIndex(i)} />
        ))}
      </Bullets>

      <Controllers>
        <div onClick={onPrevious}>
          <Icons.ArrowLeftMedium size={20} />
        </div>
        <div onClick={onNext}>
          <Icons.ArrowRightMedium size={20} />
        </div>
      </Controllers>
    </CarouselWrapper>
  );
};

export default Carousel;
