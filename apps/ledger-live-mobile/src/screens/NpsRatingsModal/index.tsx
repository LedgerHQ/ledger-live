import React, { useCallback, useEffect, useState, useMemo } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import useNpsRatings from "~/logic/npsRatings";
import QueuedDrawer from "~/components/QueuedDrawer";
import { track } from "~/analytics";

import Form from "./Form";

import Enjoy from "./Enjoy";
import DisappointedDone from "./DisappointedDone";
import { DimensionValue, LayoutChangeEvent } from "react-native";
import { useSelector } from "~/context/store";
import { trackingEnabledSelector } from "~/reducers/settings";
import getOrCreateUser from "~/user";

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

  const [equipmentId, setEquipmentId] = useState<string | null>(null);

  const trackingEnabled = useSelector(trackingEnabledSelector);

  useEffect(() => {
    if (trackingEnabled) {
      getOrCreateUser().then(({ user }) => {
        setEquipmentId(user.id);
      });
    } else {
      setEquipmentId(null);
    }
  }, [trackingEnabled]);

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
    [sharedHeight],
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
      form: <Form setStep={setStep} equipmentId={equipmentId} />,
      enjoy: <Enjoy closeModal={closeModal} />,
      disappointedDone: <DisappointedDone closeModal={closeModal} />,
    };

    return components[step as keyof typeof components];
  }, [closeModal, setStep, step, isRatingsModalOpen, equipmentId]);

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
