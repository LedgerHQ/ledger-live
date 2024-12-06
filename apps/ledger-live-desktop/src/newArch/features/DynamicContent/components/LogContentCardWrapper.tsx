import React, { useRef, useEffect, useMemo } from "react";
import * as braze from "@braze/web-sdk";
import { useSelector } from "react-redux";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { Box } from "@ledgerhq/react-ui";

interface LogContentCardWrapperProps {
  id: string;
  children: React.ReactNode;
  additionalProps?: object;
}

const PERCENTAGE_OF_CARD_VISIBLE = 0.5;

const LogContentCardWrapper: React.FC<LogContentCardWrapperProps> = ({
  id,
  children,
  additionalProps,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isTrackedUser = useSelector(trackingEnabledSelector);

  const currentCard = useMemo(() => {
    const cards = braze.getCachedContentCards().cards;
    return cards.find(card => card.id === id);
  }, [id]);

  useEffect(() => {
    if (!currentCard || !isTrackedUser) return;

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > PERCENTAGE_OF_CARD_VISIBLE) {
          braze.logContentCardImpressions([currentCard]);
          track("contentcard_impression", {
            id: currentCard.id,
            ...currentCard.extras,
            ...additionalProps,
          });
        }
      },
      { threshold: PERCENTAGE_OF_CARD_VISIBLE },
    );

    const currentRef = ref.current;

    if (currentRef) {
      intersectionObserver.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        intersectionObserver.unobserve(currentRef);
      }
    };
  }, [currentCard, isTrackedUser, additionalProps]);

  return (
    <Box width="100%" ref={ref}>
      {children}
    </Box>
  );
};

export default LogContentCardWrapper;
