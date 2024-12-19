import React, { useRef } from "react";
import { View } from "react-native";

import { useInViewContext } from "LLM/contexts/InViewContext";
import useDynamicContent from "~/dynamicContent/useDynamicContent";

type Props = {
  id: string;
  children: React.ReactNode;
};

export default function LogContentCardWrapper({ id, children }: Props) {
  const ref = useRef<View>(null);
  const { logImpressionCard } = useDynamicContent();

  useInViewContext(
    ({ isInView }) => {
      if (isInView) logImpressionCard(id);
    },
    [id, logImpressionCard],
    ref,
  );

  return <View ref={ref}>{children}</View>;
}
