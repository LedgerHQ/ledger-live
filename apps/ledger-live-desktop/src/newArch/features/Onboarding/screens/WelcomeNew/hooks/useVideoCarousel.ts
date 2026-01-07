import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import LedgerWalletBuySell from "../assets/ledgerWalletBuySell.webm";
import LedgerWalletThousandsCrypto from "../assets/ledgerWalletThousandsCrypto.webm";
import LedgerWalletSecureWallet from "../assets/ledgerWalletSecureWallet.webm";

export function useVideoCarousel() {
  const { t } = useTranslation();

  // Video carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [videoDurations, setVideoDurations] = useState<number[]>([0, 0, 0]);

  // Refs
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Video slides configuration
  const VIDEO_SLIDES = useMemo(
    () => [
      {
        video: LedgerWalletBuySell,
        title: t("onboarding.screens.welcome.videos.buySell"),
        id: "buy-sell",
      },
      {
        video: LedgerWalletThousandsCrypto,
        title: t("onboarding.screens.welcome.videos.thousandsCrypto"),
        id: "thousands-crypto",
      },
      {
        video: LedgerWalletSecureWallet,
        title: t("onboarding.screens.welcome.videos.secureWallet"),
        id: "secure-wallet",
      },
    ],
    [t],
  );

  // Video event handlers
  const handleVideoLoadedMetadata = useCallback((index: number) => {
    if (videoRefs.current[index]) {
      setVideoDurations(prev => {
        const newDurations = [...prev];
        newDurations[index] = videoRefs.current[index]?.duration ?? 0;
        return newDurations;
      });
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % VIDEO_SLIDES.length);
  }, [VIDEO_SLIDES.length]);

  // Visibility detection effect
  useEffect(() => {
    if (!document.getElementById("loader-container")) {
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return;
    }

    const fallbackTimeout = setTimeout(() => {
      if (!isVisible) {
        setIsVisible(true);
      }
    }, 6000);

    if (!isVisible) {
      const observer = new MutationObserver(() => {
        if (!document.getElementById("loader-container")) {
          setIsVisible(true);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        observer.disconnect();
        clearTimeout(fallbackTimeout);
      };
    }

    return () => clearTimeout(fallbackTimeout);
  }, [isVisible]);

  // Video playback effect
  useEffect(() => {
    if (isVisible && videoRefs.current[currentSlide]) {
      videoRefs.current[currentSlide]?.play();
    }
  }, [currentSlide, isVisible]);

  return {
    // State
    currentSlide,
    isVisible,
    videoDurations,

    // Data
    VIDEO_SLIDES,

    // Refs
    videoRefs,
    containerRef,

    // Handlers
    handleVideoLoadedMetadata,
    handleVideoEnded,
  };
}
