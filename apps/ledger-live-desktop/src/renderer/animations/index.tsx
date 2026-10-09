import React, { useEffect, useSyncExternalStore } from "react";
import { Lottie, type LottieProps } from "@shared/lottie";
import { Flex } from "@ledgerhq/react-ui";
import { getEnv } from "@shared/env";

export type AnimationLoader = () => Promise<{ default: Record<string, unknown> }>;

/** Parsed Lottie data, or a loader for the code-split device animations. */
export type AnimationSource = Record<string, unknown> | AnimationLoader;

const isLoader = (value: AnimationSource): value is AnimationLoader => typeof value === "function";

const cache = new WeakMap<AnimationLoader, Record<string, unknown>>();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Resolves an animation source to its data; undefined while a loader is pending. */
export function useAnimationData(
  source?: AnimationSource | null,
): Record<string, unknown> | undefined {
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

  return data ?? undefined;
}
const Animation = ({
  className = "",
  animation,
  loop = true,
  autoplay = true,
  width,
  height = "auto",
  fit = "contain",
  align = [0.5, 0],
}: {
  className?: string;
  animation?: AnimationSource | null;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  fit?: LottieProps["fit"];
  align?: LottieProps["align"];
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
        source={animationData}
        style={width ? { width, height } : { height }}
        role="presentation"
        loop={loop}
        autoPlay={!isPlaywright && autoplay}
        fit={fit}
        align={align}
      />
    </Flex>
  ) : null;
};
export default Animation;
