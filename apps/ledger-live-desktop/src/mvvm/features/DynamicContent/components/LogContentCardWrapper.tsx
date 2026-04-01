import React, { useRef, useEffect, useMemo } from "react";
import * as braze from "@braze/web-sdk";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  anonymousUserNotificationsSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";
import { desktopContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { track } from "~/renderer/analytics/segment";
import { Box } from "@ledgerhq/react-ui";
import { updateAnonymousUserNotifications } from "~/renderer/actions/settings";
import { OFFLINE_SEEN_DELAY } from "../utils/constants";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";

interface LogContentCardWrapperProps {
  id: string;
  children: React.ReactNode;
  additionalProps?: object;
  displayedPosition?: number;
  location?: string;
}

const PERCENTAGE_OF_CARD_VISIBLE = 0.5;
const CONTAINER_IMPRESSION_THRESHOLD = 0.8;

const LogContentCardWrapper: React.FC<LogContentCardWrapperProps> = ({
  id,
  children,
  additionalProps,
  displayedPosition,
  location,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const desktopCards = useSelector(desktopContentCardSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const anonymousUserNotifications = useSelector(anonymousUserNotificationsSelector);
  const dispatch = useDispatch();
  const isContentCardVisibleRef = useRef(false);
  const isContainerVisibleRef = useRef(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const currentCard = useMemo(() => {
    return desktopCards.find(card => card.id === id);
  }, [desktopCards, id]);

  useEffect(() => {
    if (!currentCard) return;

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (!currentCard) return;

        const isContentCardNowVisible = entry.intersectionRatio > PERCENTAGE_OF_CARD_VISIBLE;
        if (isContentCardNowVisible && !isContentCardVisibleRef.current) {
          if (isTrackedUser) {
            braze.logContentCardImpressions([currentCard]);
            track("contentcard_impression", {
              id: currentCard.id,
              ...currentCard.extras,
              ...additionalProps,
              displayedPosition,
            });
          } else {
            const cardId = currentCard.id;
            if (!cardId) return;

            const expiresAt = currentCard.expiresAt?.getTime();
            if (expiresAt !== undefined && anonymousUserNotifications[cardId] !== expiresAt) {
              notificationTimerRef.current = setTimeout(() => {
                dispatch(
                  updateAnonymousUserNotifications({
                    notifications: { [cardId]: expiresAt },
                  }),
                );
              }, OFFLINE_SEEN_DELAY);
            }
          }
        }
        isContentCardVisibleRef.current = isContentCardNowVisible;

        const isContainerNowVisible = entry.intersectionRatio >= CONTAINER_IMPRESSION_THRESHOLD;
        if (isContainerNowVisible && !isContainerVisibleRef.current && location && isTrackedUser) {
          const page = currentRouteNameRef.current ?? "";
          track("container_impression", { page, location });
        }
        isContainerVisibleRef.current = isContainerNowVisible;
      },
      { threshold: [PERCENTAGE_OF_CARD_VISIBLE, CONTAINER_IMPRESSION_THRESHOLD] },
    );

    const currentRef = ref.current;

    if (currentRef) {
      intersectionObserver.observe(currentRef);
    }

    return () => {
      clearTimeout(notificationTimerRef.current);
      if (currentRef) {
        intersectionObserver.unobserve(currentRef);
      }
    };
  }, [
    currentCard,
    isTrackedUser,
    additionalProps,
    dispatch,
    anonymousUserNotifications,
    displayedPosition,
    location,
  ]);

  return (
    <Box width="100%" ref={ref}>
      {children}
    </Box>
  );
};

export default LogContentCardWrapper;
