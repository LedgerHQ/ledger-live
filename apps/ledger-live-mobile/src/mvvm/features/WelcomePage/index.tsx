import React from "react";
import { useTheme } from "styled-components/native";
import { useIsFocused } from "@react-navigation/native";
import { Logos } from "@ledgerhq/native-ui";
import ForceTheme from "~/components/theme/ForceTheme";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { WelcomeFooter } from "./components/WelcomeFooter";
import { VideoBackground } from "./components/VideoBackground";
import { LogoView, StoryProgressView } from "./components/WelcomePage.styles";
import { StoryProgressBar } from "./components/StoryProgressBar";
import { TappableMask } from "./components/TappableMask";
import { useWelcomeNavigation } from "./hooks/useWelcomeNavigation";
import { useWelcomeStories } from "./hooks/useWelcomeStories";
import SafeAreaView from "~/components/SafeAreaView";

export default function WelcomePage() {
  const { colors } = useTheme();
  const isAppActive = !useIsAppInBackground();
  const isFocused = useIsFocused();

  const { welcomeVideos, currentVideoIndex, videoDurations, onLoad, onPrevious, onNext } =
    useWelcomeStories();
  const { onLogoTouchStart, onLogoTouchEnd } = useWelcomeNavigation();

  return (
    <ForceTheme selectedPalette={"dark"}>
      <SafeAreaView isFlex style={{ backgroundColor: colors.neutral.c60 }}>
        {/* Force re-rendering of video backgrounds when re-focused */}
        {isFocused &&
          welcomeVideos.map(({ id, source }, index) => (
            <VideoBackground
              videoSource={source}
              titleKey={`onboarding.stepWelcome.videoTitles.${index}`}
              isOnStage={currentVideoIndex === index}
              key={`welcome-video-${id}`}
              onVideoEnd={onNext}
              onVideoLoad={onLoad(index)}
            />
          ))}
        <LogoView testID="welcome-logo" onTouchStart={onLogoTouchStart} onTouchEnd={onLogoTouchEnd}>
          <Logos.LedgerLiveRegular color={colors.constant.white} width={110} height={32} />
        </LogoView>
        <StoryProgressView>
          {/* Sync the progress bar with the video duration manually */}
          {isAppActive &&
            isFocused &&
            videoDurations.map(({ durationMs, id }, index) => (
              <StoryProgressBar
                key={`welcome-progress-bar-${id}`}
                durationMs={durationMs}
                isActivated={currentVideoIndex === index}
                isCompleted={currentVideoIndex > index}
              />
            ))}
        </StoryProgressView>
        <TappableMask onPrevious={onPrevious} onNext={onNext} />
        <WelcomeFooter />
      </SafeAreaView>
    </ForceTheme>
  );
}
