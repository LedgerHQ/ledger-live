import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setModalLock } from "../actions/appstate";

/**
 * All steps of a DeviceAction that have an ongoing operation on
 * the device should disable the closing of the modal. If we are
 * transfering something (installing an app, a language, CLS, etc)
 * we don't want to break the flow.
 */
const LockModal = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setModalLock(true));
    return () => {
      dispatch(setModalLock(false));
    };
  }, [dispatch]);

  return null;
};

export default LockModal;
