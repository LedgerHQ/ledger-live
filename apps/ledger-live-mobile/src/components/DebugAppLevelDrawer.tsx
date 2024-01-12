import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "@ledgerhq/native-ui";
import QueuedDrawer from "./QueuedDrawer";
import { setDebugAppLevelDrawerOpened } from "~/actions/settings";
import { debugAppLevelDrawerOpenedSelector } from "~/reducers/settings";

/**
 * Only for debug purposes. This drawer is called at the App level (= above the react-navigation system).
 * It is meant to imitate drawers like /screens/Modals/index.tsx and test them with QueueDrawer.
 */
const DebugAppLevelDrawer = () => {
  const dispatch = useDispatch();
  const handleClose = useCallback(() => {
    dispatch(setDebugAppLevelDrawerOpened(false));
  }, [dispatch]);

  const isOpen = useSelector(debugAppLevelDrawerOpenedSelector);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
      <Alert type="info" title="This is a drawer at the App level ⛰" />
    </QueuedDrawer>
  );
};

export default DebugAppLevelDrawer;
