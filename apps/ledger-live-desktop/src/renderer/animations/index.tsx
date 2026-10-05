import React, { useEffect, useSyncExternalStore } from "react";
import Lottie, { LottieProps } from "react-lottie";
import { Flex } from "@ledgerhq/react-ui";
import { getEnv } from "@shared/env";

export type AnimationLoader = () => Promise<{ default: unknown }>;

/** Parsed Lottie data, or a loader for the code-split device animations. */
export type AnimationSource = object | AnimationLoader;

const isLoader = (value: AnimationSource): value is AnimationLoader => typeof value === "function";

const cache = new WeakMap<AnimationLoader, unknown>();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Resolves an animation source to its data; undefined while a loader is pending. */
export function useAnimationData(source?: AnimationSource | null): unknown {
  const data = useSyncExternalStore(subscribe, () =>
    source && isLoader(source) ? cache.get(source) : source,
  );

  useEffect(() => {
    if (!source || !isLoader(source) || cache.has(source)) return;
    source()
      .then(module => {
        cache.set(source, module.default);
        listeners.forEach(listener => listener());
      })
      .catch(() => {
        // A missing animation is not worth breaking the screen for.
      });
  }, [source]);

  return data;
}
const Animation = ({
  className = "",
  animation,
  loop = true,
  autoplay = true,
  width = "100%",
  height = "auto",
  rendererSettings = {
    preserveAspectRatio: "xMidYMin",
  },
  isPaused = false,
  isStopped = false,
}: {
  className?: string;
  animation?: AnimationSource | null;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  rendererSettings?: LottieProps["options"]["rendererSettings"];
  isPaused?: boolean;
  isStopped?: boolean;
}) => {
  // in case of playwright tests, we want to completely stop the animation
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");
  const animationData = useAnimationData(animation);
  return animationData ? (
    <Flex
      className={className}
      style={{
        maxHeight: `200px`,
        maxWidth: `500px`,
      }}
    >
      <Lottie
        style={{ width, height }}
        isClickToPauseDisabled
        ariaRole="animation"
        isPaused={isPaused}
        isStopped={isStopped}
        options={{
          loop,
          autoplay: !isPlaywright && autoplay,
          animationData: animationData,
          rendererSettings,
        }}
      />
    </Flex>
  ) : null;
};
export default Animation;
