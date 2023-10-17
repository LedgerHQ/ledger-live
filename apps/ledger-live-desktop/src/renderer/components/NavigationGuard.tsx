import React, { useState, useCallback, memo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Prompt, PromptProps, useHistory } from "react-router-dom";
import ConfirmModal from "~/renderer/modals/ConfirmModal";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { setNavigationLock } from "~/renderer/actions/application";

type Props = {
  /** set to tru if navigation should be locked */
  when: boolean;
  /** just lock navigation without prompt modal */
  noModal?: boolean;
  /** callback function on location to filter out block navigation according to this param */
  shouldBlockNavigation?: PromptProps["message"];
  /** confirm modal analytics name */
  analyticsName?: string;
} & Omit<
  React.ComponentProps<typeof ConfirmModal>,
  "analyticsName" | "isOpened" | "onReject" | "onConfirm"
>;

type Location = Parameters<Exclude<PromptProps["message"], string>>[0];

const NavigationGuard = ({
  when,
  noModal,
  shouldBlockNavigation = () => true,
  analyticsName = "NavigationGuard",
  ...confirmModalProps
}: Props) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [lastLocation, setLastLocation] = useState<Location | null>(null);
  const [confirmedNavigation, setConfirmedNavigation] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch();
  useEffect(() => {
    /** Set redux navigation lock status */
    dispatch(setNavigationLock(when));
    /** force close modal when condition is over */
    if (!when) setModalVisible(false);
    return () => {
      /** Reset redux navigation lock status */
      dispatch(setNavigationLock(false));
    };
  }, [dispatch, when]);

  /** show modal if needed and location to go to on confirm */
  const showModal = useCallback(
    (location: Location) => {
      setModalVisible(!noModal);
      setLastLocation(location);
    },
    [setModalVisible, setLastLocation, noModal],
  );

  /** close modal on cancel */
  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, [setModalVisible]);

  /** handles blocked location update */
  const handleBlockedNavigation = useCallback(
    (nextLocation: Location) => {
      if (
        !confirmedNavigation &&
        typeof shouldBlockNavigation === "function" &&
        // @ts-expect-error TODO: seems fishy, shouldBlockNavigation expects an action as 2nd argument according to the bindings
        shouldBlockNavigation(nextLocation)
      ) {
        /** if navigation is locked show modal */
        showModal(nextLocation);
        return false;
      }
      /** or proceed navigation */
      dispatch(setNavigationLock(false));
      return true;
    },
    [confirmedNavigation, dispatch, shouldBlockNavigation, showModal],
  );

  /** on confirm closes modal and toggles confirmation redirect */
  const handleConfirmNavigationClick = useCallback(() => {
    dispatch(setNavigationLock(false));
    setModalVisible(false);
    if (lastLocation) {
      setConfirmedNavigation(true);
    }
  }, [dispatch, lastLocation]);

  /** retry redirection once confirmation state changes */
  useEffect(() => {
    if (confirmedNavigation && lastLocation) {
      setTrackingSource("confirmation navigation guard");
      history.push({
        pathname: lastLocation.pathname,
      });
    }
  }, [confirmedNavigation, lastLocation, history]);
  return (
    <>
      <Prompt when={when} message={handleBlockedNavigation} />
      {when && (
        <ConfirmModal
          {...confirmModalProps}
          analyticsName={analyticsName}
          isOpened={modalVisible}
          onReject={handleConfirmNavigationClick}
          onConfirm={closeModal}
        />
      )}
    </>
  );
};
export default memo<Props>(NavigationGuard);
