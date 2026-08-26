import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "~/context/Locale";
import Video, { OnLoadData, ReactVideoSource, VideoRef } from "react-native-video";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { VideoTitleText } from "./WelcomePage.styles";

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
    <View style={[styles.container, { display: isOnStage ? "flex" : "none" }]}>
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
      <VideoTitleText>{t(titleKey)}</VideoTitleText>
    </View>
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
