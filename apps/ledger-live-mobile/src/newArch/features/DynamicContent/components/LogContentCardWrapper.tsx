import React, { useRef } from "react";
import { View } from "react-native";

import { useIsInViewContext } from "LLM/contexts/IsInViewContext";
import useDynamicContent from "~/dynamicContent/useDynamicContent";

type Props = {
  id: string;
  children: React.ReactNode;
};

export default function LogContentCardWrapper({ id, children }: Props) {
  const ref = useRef<View>(null);
  const { logImpressionCard } = useDynamicContent();

  useIsInViewContext(ref, ({ isInView }) => {
    if (!isInView) return;
    logImpressionCard(id);
  });

  return <View ref={ref}>{children}</View>;
}
