import React, { useEffect, useState } from "react";
import Lottie, { LottieProps } from "react-lottie";
import { Flex } from "@ledgerhq/react-ui";
import { getEnv } from "@shared/env";

export type AnimationLoader = () => Promise<{ default: unknown }>;

/**
 * Either already-parsed Lottie data, or a loader that fetches it on demand. Device
 * animations are ~10 MB and code-split per model, so `getDeviceAnimation` returns a loader;
 * animations owned by `@features/platform-device-action-content` are imported statically and
 * arrive parsed. Accepting both means none of the ~53 call sites had to change.
 */
export type AnimationSource = object | AnimationLoader;

const isLoader = (value: AnimationSource): value is AnimationLoader => typeof value === "function";

// Keyed on the loader, which is a module-level constant, so each animation is fetched once
// per session however many components request it.
const cache = new WeakMap<object, unknown>();

/**
 * Resolves a loader to its data, undefined until it arrives. `Animation` already renders
 * nothing for a missing animation, so the surrounding UI has always handled that state.
 */
export function useAnimationData(source?: AnimationSource | null): unknown {
  const [data, setData] = useState<unknown>(() =>
    source && isLoader(source) ? cache.get(source) : source,
  );

  useEffect(() => {
    if (!source || !isLoader(source)) {
      setData(source);
      return;
    }
    const cached = cache.get(source);
    if (cached !== undefined) {
      setData(cached);
      return;
    }
    let cancelled = false;
    source()
      .then(module => {
        const resolved = module?.default ?? module;
        cache.set(source, resolved);
        if (!cancelled) setData(resolved);
      })
      .catch(() => {
        // A failed chunk load leaves the animation absent rather than breaking the screen.
      });
    return () => {
      cancelled = true;
    };
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
