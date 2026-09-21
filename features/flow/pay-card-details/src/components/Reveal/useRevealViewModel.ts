import { useCallback, useEffect, useRef, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { cardManagementApi } from "@domain/api-card-management";
import { DETAILS_IMAGE_CSS } from "../CardArtwork/cardColors";
import type { RevealStatus, RevealViewModel } from "../../types";

type CardApiState = {
  [cardManagementApi.reducerPath]: ReturnType<typeof cardManagementApi.reducer>;
};

const useCardApiDispatch =
  useDispatch.withTypes<ThunkDispatch<CardApiState, unknown, UnknownAction>>();

export const FLIP_MS = 500;

export function useRevealViewModel(): RevealViewModel {
  const dispatch = useCardApiDispatch();
  const [status, setStatus] = useState<RevealStatus>("idle");
  const [imageUrl, setImageUrl] = useState<string>();
  const inFlight = useRef(false);
  const generation = useRef(0);

  const onHide = useCallback(() => {
    generation.current += 1;
    inFlight.current = false;
    setStatus("idle");
  }, []);

  const onImageLoad = useCallback(() => {
    setStatus(current => {
      if (current !== "loading") {
        return current;
      }
      inFlight.current = false;
      return "flipping";
    });
  }, []);

  // CSS flip is 500ms and Reanimated has no transitionend — Hide waits for that settle.
  useEffect(() => {
    if (status === "flipping") {
      const timer = setTimeout(() => setStatus("revealed"), FLIP_MS);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const onImageError = useCallback(() => {
    setStatus(current => {
      if (current !== "loading" && current !== "flipping" && current !== "revealed") {
        return current;
      }
      inFlight.current = false;
      setImageUrl(undefined);
      return "failed";
    });
  }, []);

  const onReveal = useCallback(async () => {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    const generationAtStart = generation.current;
    const isStale = () => generation.current !== generationAtStart;
    setStatus("loading");
    setImageUrl(undefined);

    let waitForImage = false;
    try {
      const details = await dispatch(
        cardManagementApi.endpoints.createCardDetailsToken.initiate(DETAILS_IMAGE_CSS, {
          track: false,
        }),
      ).unwrap();
      if (isStale()) {
        return;
      }
      setImageUrl(details.imageUrl);
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
  }, [dispatch]);

  return {
    status,
    isRevealed: status === "flipping" || status === "revealed",
    canHide: status === "revealed",
    imageUrl,
    onReveal,
    onHide,
    onImageLoad,
    onImageError,
  };
}
