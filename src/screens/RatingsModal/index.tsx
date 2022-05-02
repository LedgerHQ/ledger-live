import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ScrollView } from "react-native";
import { BottomDrawer } from "@ledgerhq/native-ui";
import useRatings, {
  getRatingsDataOfUserFromStorage,
  setRatingsDataOfUserInStorage,
} from "../../logic/ratings";
import Init from "./Init";
import Enjoy from "./Enjoy";
import Disappointed from "./Disappointed";
import DisappointedForm from "./DisappointedForm";
import DisappointedDone from "./DisappointedDone";
import { setRatingsDataOfUser } from "../../actions/ratings";
import { ratingsDataOfUserSelector } from "../../reducers/ratings";

const RatingsModal = () => {
  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);
  const dispatch = useDispatch();
  const initStep = useMemo(
    () => (ratingsDataOfUser?.alreadyClosedFromEnjoyStep ? "enjoy" : "init"),
    [ratingsDataOfUser?.alreadyClosedFromEnjoyStep],
  );

  useEffect(() => {
    getRatingsDataOfUserFromStorage().then(ratingsDataOfUser => {
      const ratingsDataOfUserUpdated = {
        ...ratingsDataOfUser,
        appFirstStartDate: ratingsDataOfUser?.appFirstStartDate || Date.now(),
        numberOfAppStarts: (ratingsDataOfUser?.numberOfAppStarts ?? 0) + 1,
        numberOfAppStartsSinceLastCrash:
          (ratingsDataOfUser?.numberOfAppStartsSinceLastCrash ?? 0) + 1,
      };

      dispatch(setRatingsDataOfUser(ratingsDataOfUserUpdated));
      setRatingsDataOfUserInStorage(ratingsDataOfUserUpdated);
    });
  }, [dispatch]);

  const [isRatingsModalOpen, setRatingsModalOpen] = useRatings();

  const [step, setStep] = useState(initStep);

  const closeModal = useCallback(() => {
    setRatingsModalOpen(false);
    setStep(initStep);
  }, [initStep, setRatingsModalOpen]);

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
    <BottomDrawer isOpen={isRatingsModalOpen} onClose={closeModal}>
      <ScrollView>{component}</ScrollView>
    </BottomDrawer>
  );
};

export default RatingsModal;
