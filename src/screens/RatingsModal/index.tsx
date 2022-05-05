import React, { useCallback, useEffect, useState, useMemo } from "react";
import { ScrollView } from "react-native";
import { BottomDrawer } from "@ledgerhq/native-ui";
import useRatings from "../../logic/ratings";
import Init from "./Init";
import Enjoy from "./Enjoy";
import Disappointed from "./Disappointed";
import DisappointedForm from "./DisappointedForm";
import DisappointedDone from "./DisappointedDone";

const RatingsModal = () => {
  const {
    initRatings,
    cleanRatings,
    ratingsInitialStep,
    isRatingsModalOpen,
    setRatingsModalOpen,
  } = useRatings();

  useEffect(() => {
    initRatings();

    return () => {
      cleanRatings();
    };
  }, []);

  const [step, setStep] = useState(ratingsInitialStep);

  const closeModal = useCallback(() => {
    setRatingsModalOpen(false);
    setStep(ratingsInitialStep);
  }, [ratingsInitialStep, setRatingsModalOpen]);

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
