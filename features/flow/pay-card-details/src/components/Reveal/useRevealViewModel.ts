import { useCallback, useRef, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { cardManagementApi } from "@domain/api-card-management";
import { usePayAnalyticsContext } from "@features/platform-pay-analytics";
import { DETAILS_IMAGE_CSS } from "../CardArtwork/cardColors";
import type { RevealStatus, RevealViewModel } from "../../types";

type CardApiState = {
  [cardManagementApi.reducerPath]: ReturnType<typeof cardManagementApi.reducer>;
};

const useCardApiDispatch =
  useDispatch.withTypes<ThunkDispatch<CardApiState, unknown, UnknownAction>>();

export function useRevealViewModel(): RevealViewModel {
  const dispatch = useCardApiDispatch();
  const { trackButtonClicked } = usePayAnalyticsContext();
  const [status, setStatus] = useState<RevealStatus>("idle");
  const [imageUrl, setImageUrl] = useState<string>();
  const inFlight = useRef(false);
  const generation = useRef(0);
  // The image URL is single-use, and the native image can fetch it again once revealed (e.g. back
  // from background). Each successful load allows one silent renewal instead of hiding the digits.
  const canRenew = useRef(false);

  const requestImageUrl = useCallback(async () => {
    const details = await dispatch(
      cardManagementApi.endpoints.createCardDetailsToken.initiate(DETAILS_IMAGE_CSS, {
        track: false,
      }),
    ).unwrap();
    return details.imageUrl;
  }, [dispatch]);

  const onHide = useCallback(() => {
    generation.current += 1;
    inFlight.current = false;
    canRenew.current = false;
    setStatus("idle");
  }, []);

  const onImageLoad = useCallback(() => {
    setStatus(current => {
      if (current !== "loading" && current !== "revealed") {
        return current;
      }
      inFlight.current = false;
      canRenew.current = true;
      return "revealed";
    });
  }, []);

  const renewImageUrl = useCallback(async () => {
    const generationAtStart = generation.current;
    const isStale = () => generation.current !== generationAtStart;
    try {
      const nextImageUrl = await requestImageUrl();
      if (!isStale()) {
        setImageUrl(nextImageUrl);
      }
    } catch {
      if (!isStale()) {
        setImageUrl(undefined);
        setStatus("failed");
      }
    }
  }, [requestImageUrl]);

  const onImageError = useCallback(() => {
    if (canRenew.current) {
      canRenew.current = false;
      void renewImageUrl();
      return;
    }
    setStatus(current => {
      if (current !== "loading" && current !== "revealed") {
        return current;
      }
      inFlight.current = false;
      setImageUrl(undefined);
      return "failed";
    });
  }, [renewImageUrl]);

  const onReveal = useCallback(async () => {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    trackButtonClicked({ button: "view_card_digits", page: "Card details" });
    const generationAtStart = generation.current;
    const isStale = () => generation.current !== generationAtStart;
    canRenew.current = false;
    setStatus("loading");
    setImageUrl(undefined);

    let waitForImage = false;
    try {
      const nextImageUrl = await requestImageUrl();
      if (isStale()) {
        return;
      }
      setImageUrl(nextImageUrl);
      waitForImage = true;
    } catch {
      if (isStale()) {
        return;
      }
      setImageUrl(undefined);
      setStatus("failed");
    } finally {
      if (!isStale() && !waitForImage) {
        inFlight.current = false;
      }
    }
  }, [requestImageUrl, trackButtonClicked]);

  return {
    status,
    isRevealed: status === "revealed",
    canHide: status === "revealed",
    imageUrl,
    onReveal,
    onHide,
    onImageLoad,
    onImageError,
  };
}
