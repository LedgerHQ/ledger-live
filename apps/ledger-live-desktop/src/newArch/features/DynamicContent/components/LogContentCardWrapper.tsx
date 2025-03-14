import React, { useRef, useEffect, useMemo } from "react";
import * as braze from "@braze/web-sdk";
import { useDispatch, useSelector } from "react-redux";
import {
  anonymousUserNotificationsSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { Box } from "@ledgerhq/react-ui";
import { updateAnonymousUserNotifications } from "~/renderer/actions/settings";
import { OFFLINE_SEEN_DELAY } from "../utils/constants";

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
  const anonymousUserNotifications = useSelector(anonymousUserNotificationsSelector);
  const dispatch = useDispatch();

  const currentCard = useMemo(() => {
    const cards = braze.getCachedContentCards().cards;
    return cards.find(card => card.id === id);
  }, [id]);

  useEffect(() => {
    if (!currentCard) return;

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > PERCENTAGE_OF_CARD_VISIBLE) {
          if (isTrackedUser) {
            braze.logContentCardImpressions([currentCard]);
            track("contentcard_impression", {
              id: currentCard.id,
              ...currentCard.extras,
              ...additionalProps,
            });
          } else if (
            anonymousUserNotifications[currentCard.id as string] !==
            currentCard?.expiresAt?.getTime()
          ) {
            // support new campaign or resumed campaign with the same id + different expiration date targeting anonymous users
            setTimeout(() => {
              dispatch(
                updateAnonymousUserNotifications({
                  notifications: {
                    [currentCard.id as string]: currentCard?.expiresAt?.getTime() as number,
                  },
                }),
              );
            }, OFFLINE_SEEN_DELAY);
          }
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
  }, [currentCard, isTrackedUser, additionalProps, dispatch, anonymousUserNotifications]);

  return (
    <Box width="100%" ref={ref}>
      {children}
    </Box>
  );
};

export default LogContentCardWrapper;
