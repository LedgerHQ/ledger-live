import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTranslation } from "~/context/Locale";
import Video, { OnLoadData, ReactVideoSource, VideoRef } from "react-native-video";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { VideoTitleText } from "./WelcomePage.styles";

// Stories crossfade rather than cut, so a revealed player never flashes its first frame in.
const CROSSFADE_DURATION_MS = 250;

// DIAGNOSTIC (LIVE-36099): one color per story so the crossfade is visible without the video.
const DIAGNOSTIC_COLORS = ["#E11D48", "#2563EB", "#16A34A"];

type VideoBackgroundProps = {
  videoSource: ReactVideoSource;
  titleKey: string;
  isOnStage?: boolean;
  restartKey?: number;
  onVideoLoad?: (data: OnLoadData) => void;
  onVideoEnd?: () => void;
};

/**
 * VideoBackground component to display a video background with a title.
 * @param param0 {VideoBackgroundProps} - Props for the VideoBackground component.
 * @returns React.JSX.Element
 */
export function VideoBackground({
  videoSource,
  titleKey,
  isOnStage = false,
  restartKey = 0,
  onVideoLoad,
  onVideoEnd,
}: Readonly<VideoBackgroundProps>) {
  const { t } = useTranslation();
  const videoRef = useRef<VideoRef | null>(null);
  const hasLoadedRef = useRef(false);
  const videoMounted = !useIsAppInBackground();

  // Off-stage stories stay mounted at zero opacity instead of display:none. A player detached
  // by display:none repaints a black frame when it is shown again, which reads as a flicker
  // during the story transition; keeping the layer composited and crossfading avoids it.
  const opacity = useSharedValue(isOnStage ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(isOnStage ? 1 : 0, { duration: CROSSFADE_DURATION_MS });
  }, [isOnStage, opacity]);
  const animatedContainerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);

  const handleLoad = useCallback(
    (data: OnLoadData) => {
      hasLoadedRef.current = true;
      onVideoLoad?.(data);
    },
    [onVideoLoad],
  );

  useEffect(() => {
    if (videoMounted) return;
    hasLoadedRef.current = false;
  }, [videoMounted]);

  // Rewind on entering the stage rather than on leaving it: a hidden player can drop a
  // seek it was asked to perform, which would resume the story mid-clip on the next visit.
  // A player that has not loaded yet is already at its first frame, and seeking it before
  // it is ready leaves it stalled on a blank frame.
  useEffect(() => {
    if (isOnStage && hasLoadedRef.current) {
      videoRef.current?.seek(0);
    }
  }, [isOnStage, restartKey]);

  const handleEnd = useCallback(() => {
    if (!isOnStage) return;
    // Rewind while the player is still visible: a player left on its last frame reports the
    // end again as soon as it is resumed, which skips the story on the next lap.
    videoRef.current?.seek(0);
    onVideoEnd?.();
  }, [isOnStage, onVideoEnd]);

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]} pointerEvents="none">
      {videoMounted && (
        <Video
          ref={videoRef}
          resizeMode="cover"
          muted
          disableFocus
          repeat={!isOnStage}
          source={videoSource}
          style={[styles.backgroundVideo]}
          onLoad={handleLoad}
          onEnd={handleEnd}
          paused={!isOnStage}
        />
      )}
      {/* DIAGNOSTIC (LIVE-36099): colored overlay on top of the video, driven by the same
          crossfade opacity. If you see these colors fading between stories, the crossfade
          layer renders fine and the black is react-native-video on the simulator. If it stays
          black, the opacity change is at fault. REVERT before merge. */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              DIAGNOSTIC_COLORS[Number(titleKey.slice(-1)) % DIAGNOSTIC_COLORS.length],
          },
        ]}
      />
      <VideoTitleText>{t(titleKey)}</VideoTitleText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "#1C1C1C",
  },
  backgroundVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
