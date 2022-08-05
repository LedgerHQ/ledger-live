import React, { useCallback, useEffect, useState, useMemo } from "react";
import { BottomDrawer } from "@ledgerhq/native-ui";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import useRatings from "../../logic/ratings";
import Init from "./Init";
import Enjoy from "./Enjoy";
import Disappointed from "./Disappointed";
import DisappointedForm from "./DisappointedForm";
import DisappointedDone from "./DisappointedDone";

const RatingsModal = () => {
  const {
    initRatings,
    initRatingsData,
    cleanRatings,
    ratingsInitialStep,
    isRatingsModalOpen,
    setRatingsModalOpen,
  } = useRatings();

  useEffect(() => {
    initRatings();

    return () => {
      cleanRatings();
    };
  }, [initRatings, cleanRatings]);

  useEffect(() => {
    initRatingsData();
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
  const onLayout = useCallback(({ nativeEvent: { layout } }) => {
    sharedHeight.value = withTiming(layout.height, { duration: 200 });
  }, []);

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

  const component = useMemo(() => {
    const components = {
      init: <Init closeModal={closeModal} setStep={setStep} />,
      enjoy: <Enjoy closeModal={closeModal} />,
      disappointed: <Disappointed closeModal={closeModal} setStep={setStep} />,
      disappointedForm: <DisappointedForm setStep={setStep} />,
      disappointedDone: <DisappointedDone closeModal={closeModal} />,
    };

    return components[step];
  }, [closeModal, setStep, step]);

  return (
    <BottomDrawer
      isOpen={isRatingsModalOpen}
      onClose={closeModal}
      noCloseButton
    >
      <Animated.ScrollView style={animatedStyle}>
        <Animated.View onLayout={onLayout}>{component}</Animated.View>
      </Animated.ScrollView>
    </BottomDrawer>
  );
};

export default RatingsModal;
