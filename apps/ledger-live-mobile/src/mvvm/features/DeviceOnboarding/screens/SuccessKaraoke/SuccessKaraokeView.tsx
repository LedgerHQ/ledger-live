import React, { useEffect, useRef } from "react";
import { Karaoke } from "@shared/ui-karaoke/native";
import { successKaraokeTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { SuccessKaraokeViewProps } from "./useSuccessKaraokeViewModel";

export function SuccessKaraokeView({ phrases, tapLabel, onFinish }: SuccessKaraokeViewProps) {
  return (
    <Karaoke.Root phrases={phrases} tapLabel={tapLabel} testID={successKaraokeTestIds.screen}>
      <Karaoke.Sequence />
      <Karaoke.Final>
        <FinishOnShow onFinish={onFinish} />
      </Karaoke.Final>
    </Karaoke.Root>
  );
}

function FinishOnShow({ onFinish }: Readonly<{ onFinish: () => void }>) {
  const finished = useRef(false);

  useEffect(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish();
  }, [onFinish]);

  return null;
}
