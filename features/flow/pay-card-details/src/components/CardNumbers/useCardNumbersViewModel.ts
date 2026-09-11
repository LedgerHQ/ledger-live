import { useRef, useState } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { cardManagementApi } from "@domain/api-card-management";
import type { CardNumbersProps, CardNumbersStatus, CardNumbersViewProps } from "../../types";

type CardApiState = {
  [cardManagementApi.reducerPath]: ReturnType<typeof cardManagementApi.reducer>;
};

const useCardApiDispatch =
  useDispatch.withTypes<ThunkDispatch<CardApiState, unknown, UnknownAction>>();

export function useCardNumbersViewModel({ unlock }: CardNumbersProps): CardNumbersViewProps {
  const dispatch = useCardApiDispatch();
  const [status, setStatus] = useState<CardNumbersStatus>("idle");
  const [imageUrl, setImageUrl] = useState<string>();
  const inFlight = useRef(false);
  const generation = useRef(0);

  async function onReveal() {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    const generationAtStart = generation.current;
    const isStale = () => generation.current !== generationAtStart;
    setStatus("loading");
    setImageUrl(undefined);

    try {
      const unlocked = await unlock();
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
  }

  function onHide() {
    generation.current += 1;
    inFlight.current = false;
    setImageUrl(undefined);
    setStatus("idle");
  }

  function onImageError() {
    setImageUrl(undefined);
    setStatus("failed");
  }

  return {
    status,
    imageUrl,
    onReveal,
    onHide,
    onImageError,
  };
}
