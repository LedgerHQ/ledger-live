import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useTransition, animated } from "react-spring";
import IconArrowRight from "~/renderer/icons/ArrowRight";
import { Card } from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import TimeBasedProgressBar from "~/renderer/components/Carousel/TimeBasedProgressBar";
import IconCross from "~/renderer/icons/Cross";
import { getTransitions, useDefaultSlides } from "~/renderer/components/Carousel/helpers";
import { track } from "~/renderer/analytics/segment";

const CarouselWrapper = styled(Card)`
  position: relative;
  height: 100px;
  margin: 20px 0;
`;

const Close = styled.div`
  position: absolute;
  color: ${p => p.theme.colors.palette.text.shade30};
  top: 16px;
  right: 16px;
  cursor: pointer;
  &:hover {
    color: ${p => p.theme.colors.palette.text.shade100};
  }
`;

const Previous = styled.div`
  position: absolute;
  color: ${p => p.theme.colors.palette.text.shade30};
  bottom: 16px;
  right: 42px;
  cursor: pointer;
  transform: rotate(180deg);
  &:hover {
    color: ${p => p.theme.colors.palette.text.shade100};
  }
`;

const Next = styled.div`
  position: absolute;
  color: ${p => p.theme.colors.palette.text.shade30};
  bottom: 11px;
  right: 16px;
  cursor: pointer;
  &:hover {
    color: ${p => p.theme.colors.palette.text.shade100};
  }
`;

// NB left here because it handles the transitions
const ProgressBarWrapper = styled.div`
  position: absolute;
  bottom: 0;
  z-index: 100;
  width: 100%;
  display: none;
`;

const Bullets = styled.div<{ index: number }>`
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  & > div {
    cursor: pointer;
    & > span {
      display: block;
      border-radius: 6px;
      height: 6px;
      width: 6px;
      background: ${p => p.theme.colors.palette.text.shade40};
    }
    padding: 15px 5px;
    margin-bottom: -15px;
    &:nth-child(${p => p.index + 1}) > span {
      background: ${p => p.theme.colors.palette.text.shade80};
    }
  }
`;

const Slides = styled.div`
  width: 100%;
  height: 100px;
  border-radius: 4px;
  perspective: 1000px;
  overflow: hidden;
  background: ${p => p.theme.colors.palette.background.paper};

  & > div {
    transform-origin: center right;
    backface-visibility: hidden;
    transform-style: preserve-3d;
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: 800;
    font-size: 8em;
    will-change: transform, opacity;
  }
`;

export const Label = styled(Text)`
  color: ${p => p.theme.colors.palette.text.shade100};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.1em;

  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

export const IllustrationWrapper = styled.div`
  width: 257px;
  height: 100%;
  pointer-events: none;
  position: relative;
  right: 0;
  align-self: flex-end;
`;

export const Wrapper = styled.div`
  width: 100%;
  height: 100px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  cursor: pointer;
`;

const Carousel = ({
  withArrows = true,
  controls = true,
  speed = 6000,
  type = "slide",
}: {
  withArrows?: boolean;
  controls?: boolean;
  speed?: number;
  type?: "slide" | "flip";
}) => {
  const { slides, logSlideImpression, dismissCard } = useDefaultSlides();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reverse, setReverse] = useState(false);
  const transitions = useTransition(index, p => p, getTransitions(type, reverse));

  useEffect(() => {
    logSlideImpression(0);
  }, [logSlideImpression]);

  const changeVisibleSlide = useCallback(
    (index: number) => {
      setIndex(index);
      logSlideImpression(index);
    },
    [logSlideImpression],
  );

  const onChooseSlide = useCallback(
    (newIndex: number) => {
      setReverse(index > newIndex);
      changeVisibleSlide(newIndex);
    },
    [index, changeVisibleSlide],
  );

  const onDismiss = useCallback(() => {
    track("contentcard_dismissed", {
      card: slides[index].id,
      page: "Portfolio",
    });
    dismissCard(index);
    changeVisibleSlide((index + 1) % slides.length);
  }, [index, slides, dismissCard, changeVisibleSlide]);

  const onNext = useCallback(() => {
    setReverse(false);
    changeVisibleSlide((index + 1) % slides.length);
    track("contentcards_slide", {
      button: "next",
      page: "Portfolio",
    });
  }, [index, slides.length, changeVisibleSlide]);

  const onPrev = useCallback(() => {
    setReverse(true);
    changeVisibleSlide(!index ? slides.length - 1 : index - 1);
    track("contentcards_slide", {
      button: "previous",
      page: "Portfolio",
    });
  }, [index, slides.length, changeVisibleSlide]);

  if (!slides.length) {
    // No slides or dismissed, no problem
    return null;
  }

  const showControls = controls && slides.length > 1;

  return (
    <CarouselWrapper
      data-test-id="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.length > 1 ? (
        <ProgressBarWrapper>
          <TimeBasedProgressBar onComplete={onNext} duration={speed} paused={paused} />
        </ProgressBarWrapper>
      ) : null}
      <Slides>
        {transitions.map(({ item, props, key }) => {
          if (!slides?.[item]) return null;

          const { Component } = slides[item];
          return (
            <animated.div key={key} style={{ ...props }}>
              <Component />
            </animated.div>
          );
        })}
      </Slides>
      <Close data-test-id="carousel-close-button" onClick={onDismiss}>
        <IconCross size={16} />
      </Close>
      {showControls ? (
        <>
          {withArrows ? (
            <>
              <Next onClick={onNext}>
                <IconArrowRight size={16} />
              </Next>
              <Previous onClick={onPrev}>
                <IconArrowRight size={16} />
              </Previous>
            </>
          ) : (
            <Bullets index={index}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => onChooseSlide(i)}>
                  <span />
                </div>
              ))}
            </Bullets>
          )}
        </>
      ) : null}
    </CarouselWrapper>
  );
};

export default Carousel;
