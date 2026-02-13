import React, { useRef } from "react";
import { View } from "react-native";

import { useInViewContext } from "LLM/contexts/InViewContext";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { localMobileCardsSelector, localCategoriesCardsSelector } from "~/reducers/dynamicContent";
import { useSelector } from "~/context/hooks";

const CONTAINER_IMPRESSION_THRESHOLD = 0.8;

type Props = {
  id: string;
  children: React.ReactNode;
  displayedPosition?: number;
  location?: string;
};

export default function LogContentCardWrapper({
  id,
  children,
  displayedPosition,
  location,
}: Props) {
  const ref = useRef<View | null>(null);
  const { logImpressionCard } = useDynamicContent();
  const localMobileCards = useSelector(localMobileCardsSelector);
  const localCategoriesCards = useSelector(localCategoriesCardsSelector);
  const isLocal =
    localMobileCards.some(c => c.id === id) || localCategoriesCards.some(c => c.id === id);
  const isContainerVisibleRef = useRef(false);

  useInViewContext(
    ({ isInView, progressRatio }) => {
      if (isLocal) return;
      if (isInView) logImpressionCard(id, displayedPosition);

      const isNowVisible = progressRatio >= CONTAINER_IMPRESSION_THRESHOLD;
      if (isNowVisible && !isContainerVisibleRef.current && location) {
        const page = currentRouteNameRef.current ?? "";
        track("container_impression", { page, location });
      }
      isContainerVisibleRef.current = isNowVisible;
    },
    [isLocal, logImpressionCard, id, displayedPosition, location],
    // @ts-expect-error REACT19FIXME: RefObject<View | null> not assignable to RefObject<View>
    ref,
  );

  return <View ref={ref}>{children}</View>;
}
