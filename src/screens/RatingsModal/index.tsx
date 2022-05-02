import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
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

const RatingsModal = () => {
  const dispatch = useDispatch();

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

  const [step, setStep] = useState("init");

  const closeModal = useCallback(() => {
    // console.log(a);
    setRatingsModalOpen(false);
    setStep("init");
  }, [setRatingsModalOpen]);

  return (
    <BottomDrawer isOpen={isRatingsModalOpen} onClose={closeModal}>
      <ScrollView>
        {step === "init" ? (
          <Init closeModal={closeModal} setStep={setStep} />
        ) : null}
        {step === "enjoy" ? <Enjoy closeModal={closeModal} /> : null}
        {step === "disappointed" ? (
          <Disappointed closeModal={closeModal} setStep={setStep} />
        ) : null}
        {step === "disappointedForm" ? (
          <DisappointedForm setStep={setStep} />
        ) : null}
        {step === "disappointedDone" ? (
          <DisappointedDone closeModal={closeModal} />
        ) : null}
      </ScrollView>
    </BottomDrawer>
  );
};

export default RatingsModal;
