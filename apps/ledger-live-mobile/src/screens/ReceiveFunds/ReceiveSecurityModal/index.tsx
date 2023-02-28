import React, { useCallback, useEffect, useState, useMemo } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QueuedDrawer from "../../../components/QueuedDrawer";
import InitMessage from "./InitMessage";
import ConfirmUnverified from "./ConfirmUnverified";

const shouldNotRemindUserAgainToVerifyAddressOnReceive =
  "shouldNotRemindUserAgainToVerifyAddressOnReceive";

const ReceiveSecurityModal = ({
  onVerifyAddress,
}: {
  onVerifyAddress: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function getShouldNotRemindUserAgain() {
    const shouldNotRemindUserAgain = await AsyncStorage.getItem(
      shouldNotRemindUserAgainToVerifyAddressOnReceive,
    );
    return shouldNotRemindUserAgain
      ? JSON.parse(shouldNotRemindUserAgain)
      : false;
  }

  async function setShouldNotRemindUserAgain() {
    await AsyncStorage.setItem(
      shouldNotRemindUserAgainToVerifyAddressOnReceive,
      JSON.stringify(true),
    );
  }

  useEffect(() => {
    getShouldNotRemindUserAgain().then(shouldNotRemindUserAgain => {
      if (!shouldNotRemindUserAgain) {
        setTimeout(() => {
          setIsModalOpen(true);
        }, 800);
      }
    });
  }, []);

  const [step, setStep] = useState("initMessage");
  const sharedHeight = useSharedValue(0);
  const onLayout = useCallback(({ nativeEvent: { layout } }) => {
    sharedHeight.value = withTiming(layout.height, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(
    () => ({
      height: sharedHeight.value,
    }),
    [],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setStep("initMessage");
    sharedHeight.value = 0;
  }, [setIsModalOpen, sharedHeight]);

  const onVerify = useCallback(() => {
    closeModal();
    onVerifyAddress();
  }, [closeModal, onVerifyAddress]);

  const component = useMemo(() => {
    const components = {
      initMessage: <InitMessage setStep={setStep} onVerifyAddress={onVerify} />,
      confirmUnverified: (
        <ConfirmUnverified
          closeModal={closeModal}
          setStep={setStep}
          setShouldNotRemindUserAgain={setShouldNotRemindUserAgain}
        />
      ),
    };

    return components[step as keyof typeof components];
  }, [closeModal, onVerify, step]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isModalOpen}
      onClose={closeModal}
      noCloseButton
      preventBackdropClick
    >
      <Animated.ScrollView style={animatedStyle}>
        <Animated.View onLayout={onLayout}>{component}</Animated.View>
      </Animated.ScrollView>
    </QueuedDrawer>
  );
};

export default ReceiveSecurityModal;
