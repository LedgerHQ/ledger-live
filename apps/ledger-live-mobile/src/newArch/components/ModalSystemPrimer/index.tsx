import React, { useEffect } from "react";
import { Modal, View } from "react-native";

// Global flag to track if Modal system has been primed
let isModalSystemPrimed = false;

/**
 * Component to prime the React Native Modal system on app startup.
 *
 * This fixes a layout calculation bug on android where modals don't
 * render correctly on their first open. By opening and immediately
 * closing a dummy modal, we initialize the Modal system's state.
 */
export const ModalSystemPrimer = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    if (!isModalSystemPrimed) {
      setIsVisible(true);
      const timeout = setTimeout(() => {
        setIsVisible(false);
        isModalSystemPrimed = true;
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <View style={{ height: 1 }} />
    </Modal>
  );
};
