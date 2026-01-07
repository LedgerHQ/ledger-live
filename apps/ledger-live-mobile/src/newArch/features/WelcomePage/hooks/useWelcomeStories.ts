import { useCallback, useEffect, useMemo, useState } from "react";
import { OnLoadData, ReactVideoSource } from "react-native-video";
import videoSources from "../assets";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { useIsFocused } from "@react-navigation/native";

const welcomeVideos: { source: ReactVideoSource; id: string }[] = [
  { source: videoSources.welcomeBasic1, id: "welcome-basic-1" },
  { source: videoSources.welcomeBasic2, id: "welcome-basic-2" },
  { source: videoSources.welcomeBasic3, id: "welcome-basic-3" },
];

/**
 * Custom hook to manage the welcome video stories.
 * @returns An object containing the welcome videos, current video index, video durations, and navigation handlers.
 */
export function useWelcomeStories() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [durations, setDurations] = useState<number[]>(new Array(welcomeVideos.length).fill(0));

  const isAppActive = !useIsAppInBackground();

  // Reset to the first video when the app goes to the background
  useEffect(() => {
    if (!isAppActive) {
      setCurrentVideoIndex(0);
    }
  }, [isAppActive]);

  // Reset to the first video when the screen is re-focused
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      setCurrentVideoIndex(0);
    }
  }, [isFocused]);

  const onLoad = useCallback(
    (index: number) =>
      ({ duration }: OnLoadData) => {
        setDurations(prev => {
          const newDurations = [...prev];
          newDurations[index] = Number((duration * 1000).toFixed(0));
          return newDurations;
        });
      },
    [],
  );

  const onPrevious = useCallback(() => {
    setCurrentVideoIndex(index => (index - 1 + welcomeVideos.length) % welcomeVideos.length);
  }, []);

  const onNext = useCallback(() => {
    setCurrentVideoIndex(index => (index + 1) % welcomeVideos.length);
  }, []);

  const durationsWithId = useMemo(() => {
    return durations.map((duration, index) => ({
      id: welcomeVideos[index].id,
      durationMs: duration,
    }));
  }, [durations]);

  return {
    welcomeVideos,
    currentVideoIndex,
    videoDurations: durationsWithId,
    onLoad,
    onPrevious,
    onNext,
  };
}
