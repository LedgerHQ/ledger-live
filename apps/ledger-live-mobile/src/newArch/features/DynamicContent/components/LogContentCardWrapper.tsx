import React, { useRef } from "react";
import { View } from "react-native";

import { useInViewContext } from "LLM/contexts/InViewContext";
import useDynamicContent from "~/dynamicContent/useDynamicContent";

type Props = {
  id: string;
  children: React.ReactNode;
};

export default function LogContentCardWrapper({ id, children }: Props) {
  const ref = useRef<View | null>(null);
  const { logImpressionCard } = useDynamicContent();

  useInViewContext(
    ({ isInView }) => {
      if (isInView) logImpressionCard(id);
    },
    [id, logImpressionCard],
    // @ts-expect-error REACT19FIXME: RefObject<View | null> not assignable to RefObject<View>
    ref,
  );

  return <View ref={ref}>{children}</View>;
}
