import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import Video, { OnLoadData, ReactVideoSource, VideoRef } from "react-native-video";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { VideoTitleText } from "./WelcomePage.styles";

type VideoBackgroundProps = {
  videoSource: ReactVideoSource;
  titleKey: string;
  isOnStage?: boolean;
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
  onVideoLoad,
  onVideoEnd,
}: Readonly<VideoBackgroundProps>) {
  const { t } = useTranslation();
  const videoRef = useRef<VideoRef | null>(null);
  const videoMounted = !useIsAppInBackground();

  useEffect(() => {
    if (!isOnStage) {
      videoRef.current?.seek(0);
    }
  }, [isOnStage]);

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
          onLoad={onVideoLoad}
          onEnd={() => {
            onVideoEnd?.();
          }}
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
