import { useCallback, useRef, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { cardManagementApi } from "@domain/api-card-management";
import type { CardDetailsProps, RevealStatus, RevealViewModel } from "../../types";

type CardApiState = {
  [cardManagementApi.reducerPath]: ReturnType<typeof cardManagementApi.reducer>;
};

const useCardApiDispatch =
  useDispatch.withTypes<ThunkDispatch<CardApiState, unknown, UnknownAction>>();

export function useRevealViewModel({
  unlock,
}: Pick<CardDetailsProps, "unlock">): RevealViewModel | null {
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

  const onImageError = useCallback(() => {
    setImageUrl(undefined);
    setStatus("failed");
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

    try {
      const unlocked = await unlock?.();
      if (isStale()) {
        return;
      }
      if (!unlocked) {
        setStatus("idle");
        return;
      }

      const details = await dispatch(
        cardManagementApi.endpoints.createCardDetailsToken.initiate(undefined, { track: false }),
      ).unwrap();
      if (isStale()) {
        return;
      }
      setImageUrl(details.imageUrl);
      setStatus("revealed");
    } catch {
      if (isStale()) {
        return;
      }
      setImageUrl(undefined);
      setStatus("failed");
    } finally {
      if (!isStale()) {
        inFlight.current = false;
      }
    }
  }, [dispatch, unlock]);

  if (!unlock) {
    return null;
  }

  return {
    status,
    isRevealed: status === "revealed" && Boolean(imageUrl),
    imageUrl,
    onReveal,
    onHide,
    onImageError,
  };
}
