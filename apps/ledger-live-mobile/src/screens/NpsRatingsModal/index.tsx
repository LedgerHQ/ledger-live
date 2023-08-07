import React, { useCallback, useEffect, useState, useMemo } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import useNpsRatings from "../../logic/npsRatings";
import QueuedDrawer from "../../components/QueuedDrawer";
import { track } from "../../analytics";

import Form from "./Form";

import Enjoy from "./Enjoy";
import DisappointedDone from "./DisappointedDone";

const eventNameByPage: Record<string, string> = {
  form: "NPS Step 1 Rating",
  enjoy: "NPS Step 3 Ask Ratings",
  disappointedDone: "NPS Step 2 not Happy",
};

const RatingsModal = () => {
  const {
    initRatingsData,
    ratingsInitialStep,
    isRatingsModalOpen,
    setRatingsModalOpen,
    handleInitNotNow,
  } = useNpsRatings();

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
    ({ nativeEvent: { layout } }) => {
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
    handleInitNotNow();
    sharedHeight.value = null;
  }, [handleInitNotNow, ratingsInitialStep, setRatingsModalOpen, sharedHeight]);

  const handleBackdropClose = useCallback(() => {
    track("button_clicked", {
      flow: "NPS",
      page: eventNameByPage[step],
      button: "Close",
    });
    closeModal();
  }, [closeModal, step]);

  const component = useMemo(() => {
    if (!isRatingsModalOpen) return null; //to prevent step 1 re-mounting and page tracking when closing the modal
    const components = {
      form: <Form setStep={setStep} />,
      enjoy: <Enjoy closeModal={closeModal} />,
      disappointedDone: <DisappointedDone closeModal={closeModal} />,
    };

    return components[step as keyof typeof components];
  }, [closeModal, setStep, step, isRatingsModalOpen]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isRatingsModalOpen}
      onClose={handleBackdropClose}
      onBackdropPress={handleBackdropClose}
      onBackButtonPress={handleBackdropClose}
      onSwipeComplete={handleBackdropClose}
    >
      <Animated.ScrollView style={animatedStyle}>
        <Animated.View onLayout={onLayout}>{component}</Animated.View>
      </Animated.ScrollView>
    </QueuedDrawer>
  );
};

export default RatingsModal;
