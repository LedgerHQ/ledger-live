import React, { useCallback, useEffect, useState, useMemo } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import useRatings from "~/logic/ratings";
import QueuedDrawer from "~/components/QueuedDrawer";
import Init from "./Init";
import Enjoy from "./Enjoy";
import Disappointed from "./Disappointed";
import DisappointedForm from "./DisappointedForm";
import DisappointedDone from "./DisappointedDone";
import { LayoutChangeEvent } from "react-native";

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
  /**
   * Having an initial value of null will prevent having "height: 0" before the
   * initial call of onLayout.
   * The component will just layout normally without an animation which is ok
   * since this will happen only on the first step.
   * Without this default behavior, there are issues on iOS where sometimes the
   * height is stuck at 0.
   */
  const sharedHeight = useSharedValue<number | null>(null);
  const onLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sharedHeight.value = withTiming(layout.height, { duration: 200 });
    },
    [sharedHeight],
  );

  const animatedStyle = useAnimatedStyle(
    () => ({
      /**
       * If it's null the component still renders normally at its full height
       * without its height being derived from an animated value.
       */
      height: sharedHeight.value ?? undefined,
    }),
    [],
  );

  const closeModal = useCallback(() => {
    setRatingsModalOpen(false);
    setStep(ratingsInitialStep);
    sharedHeight.value = null;
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
