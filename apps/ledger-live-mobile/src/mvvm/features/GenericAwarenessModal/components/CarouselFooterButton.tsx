import React from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { Linking } from "react-native";
import type { CarouselSlide } from "../types";

type CarouselFooterButtonProps = Readonly<{
  slides: CarouselSlide[];
  onClose: () => void;
}>;

export function CarouselFooterButton({ slides, onClose }: CarouselFooterButtonProps) {
  const { currentIndex, goToNext } = useSlidesContext();
  const currentSlide = slides[currentIndex];

  const onPress = async () => {
    switch (currentSlide.primaryButtonAction) {
      case "navigate":
        await Linking.openURL(currentSlide.primaryButtonLink).catch(() => undefined);
        requestAnimationFrame(onClose);
        return;
      case "dismiss":
        onClose();
        return;
      case "next":
        goToNext();
        return;
    }
  };

  return (
    <Button appearance="base" size="lg" onPress={onPress}>
      {currentSlide.primaryButtonLabel}
    </Button>
  );
}
