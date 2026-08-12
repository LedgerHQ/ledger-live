import React, { useCallback, useEffect, useState, useMemo } from "react";
import { ScrollView } from "react-native";
import storage from "LLM/storage";
import QueuedDrawer from "~/components/QueuedDrawer";
import InitMessage from "./InitMessage";
import ConfirmUnverified from "./ConfirmUnverified";

const shouldNotRemindUserAgainToVerifyAddressOnReceive =
  "shouldNotRemindUserAgainToVerifyAddressOnReceive";

const ReceiveSecurityModal = ({
  onVerifyAddress,
  triggerSuccessEvent,
}: {
  onVerifyAddress: () => void;
  triggerSuccessEvent: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function getShouldNotRemindUserAgain() {
    const shouldNotRemindUserAgain = await storage.get<boolean>(
      shouldNotRemindUserAgainToVerifyAddressOnReceive,
    );
    return typeof shouldNotRemindUserAgain === "boolean" ? shouldNotRemindUserAgain : false;
  }

  async function setShouldNotRemindUserAgain() {
    await storage.save(shouldNotRemindUserAgainToVerifyAddressOnReceive, true);
  }

  useEffect(() => {
    getShouldNotRemindUserAgain().then(shouldNotRemindUserAgain => {
      if (!shouldNotRemindUserAgain) {
        setTimeout(() => {
          setIsModalOpen(true);
        }, 800);
      }
    });
    triggerSuccessEvent();
  }, [triggerSuccessEvent]);

  const [step, setStep] = useState("initMessage");

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setStep("initMessage");
  }, []);

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

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return components[step as keyof typeof components];
  }, [closeModal, onVerify, step]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isModalOpen}
      onClose={closeModal}
      noCloseButton
      preventBackdropClick
    >
      <ScrollView>{component}</ScrollView>
    </QueuedDrawer>
  );
};

export default ReceiveSecurityModal;
