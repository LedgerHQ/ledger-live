import React, { useCallback, useEffect, useState, useMemo } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import useRatings from "~/logic/ratings";
import QueuedDrawer from "~/components/QueuedDrawer";
import Init from "./Init";
import Enjoy from "./Enjoy";
import Disappointed from "./Disappointed";
import DisappointedForm from "./DisappointedForm";
import DisappointedDone from "./DisappointedDone";
import { DimensionValue, LayoutChangeEvent } from "react-native";

const RatingsModal = () => {
  const {
    initRatingsData,
    ratingsInitialStep,
    isRatingsModalOpen,
    setRatingsModalOpen,
    handleInitNotNow,
  } = useRatings();

  useEffect(() => {
    initRatingsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState(ratingsInitialStep);

  const sharedHeight = useSharedValue<DimensionValue>(0);
  const onLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sharedHeight.value = withTiming(layout.height, { duration: 200 });
    },
    [sharedHeight],
  );
  const animatedStyle = useAnimatedStyle(
    () => ({
      height: sharedHeight.value ?? 0,
    }),
    [],
  );

  const closeModal = useCallback(() => {
    setRatingsModalOpen(false);
    setStep(ratingsInitialStep);
    sharedHeight.value = 0;
  }, [ratingsInitialStep, setRatingsModalOpen, sharedHeight]);

  const handleBackdropClose = useCallback(() => {
    handleInitNotNow();
    closeModal();
  }, [handleInitNotNow, closeModal]);

  const component = useMemo(() => {
    const components = {
      init: <Init closeModal={closeModal} setStep={setStep} />,
      enjoy: <Enjoy closeModal={closeModal} />,
      disappointed: <Disappointed closeModal={closeModal} setStep={setStep} />,
      disappointedForm: <DisappointedForm setStep={setStep} />,
      disappointedDone: <DisappointedDone closeModal={closeModal} />,
    };

    return components[step as keyof typeof components];
  }, [closeModal, setStep, step]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isRatingsModalOpen}
      onClose={closeModal}
      onBackdropPress={handleBackdropClose}
      onBackButtonPress={handleBackdropClose}
      onSwipeComplete={handleBackdropClose}
      noCloseButton
    >
      <Animated.ScrollView style={animatedStyle}>
        <Animated.View onLayout={onLayout}>{component}</Animated.View>
      </Animated.ScrollView>
    </QueuedDrawer>
  );
};

export default RatingsModal;
