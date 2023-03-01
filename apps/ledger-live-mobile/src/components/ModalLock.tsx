import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { setModalLock } from "../actions/appstate";

/**
 * If mounted, lock all drawers using the modalLock redux app state (components/QueuedDrawer)
 *
 * The modal lock is reset when losing the react-navigation screen focus.
 *
 * Used in some DeviceAction displayed in drawers:
 * All steps of a DeviceAction that have an ongoing operation on
 * the device should disable the closing of the modal. If we are
 * transfering something (installing an app, a language, CLS, etc)
 * we don't want to break the flow.
 */
const ModalLock = () => {
  const dispatch = useDispatch();

  // Triggered when the screen gets the (react-navigation) focus
  useFocusEffect(
    useCallback(() => {
      dispatch(setModalLock(true));

      return () => {
        dispatch(setModalLock(false));
      };
    }, [dispatch]),
  );

  return null;
};

export default ModalLock;
