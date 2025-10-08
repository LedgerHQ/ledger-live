import React, { useCallback, useState } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import QueuedDrawer from "~/components/QueuedDrawer";
import Config from "react-native-config";
import { LayoutChangeEvent } from "react-native";
import Message from "./Message";

const SanctionedAccountModal = ({
  userAddress,
  onClose,
}: {
  userAddress: string;
  onClose: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const sharedHeight = useSharedValue(0);
  const onLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sharedHeight.value = withTiming(layout.height, { duration: 200 });
    },
    [sharedHeight],
  );

  const animatedStyle = useAnimatedStyle(
    () => ({
      height: sharedHeight.value,
    }),
    [sharedHeight],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    sharedHeight.value = 0;
  }, [setIsModalOpen, sharedHeight]);

  const onCloseModal = useCallback(() => {
    closeModal();
    onClose();
  }, [closeModal, onClose]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isModalOpen}
      onClose={closeModal}
      noCloseButton
      preventBackdropClick
    >
      <Animated.ScrollView style={Config.DETOX ? undefined : animatedStyle}>
        <Animated.View onLayout={onLayout}>
          <Message userAddress={userAddress} onClose={onCloseModal} />
        </Animated.View>
      </Animated.ScrollView>
    </QueuedDrawer>
  );
};

export default SanctionedAccountModal;
