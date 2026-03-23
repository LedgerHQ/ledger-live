import React, { useEffect, useRef } from "react";
import { BoxedIcon, Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";

const READY_REDIRECT_DELAY_MS = 2_500;

type DeviceSeededSuccessPanelProps = {
  handleNextStep: () => void;
  productName: string;
};

const DeviceSeededSuccessPanel = ({
  handleNextStep,
  productName,
}: DeviceSeededSuccessPanelProps) => {
  const { t } = useTranslation();
  const readyRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    readyRedirectTimerRef.current = setTimeout(handleNextStep, READY_REDIRECT_DELAY_MS);

    return () => {
      if (readyRedirectTimerRef.current) {
        clearTimeout(readyRedirectTimerRef.current);
        readyRedirectTimerRef.current = null;
      }
    };
  }, [handleNextStep]);

  return (
    <Flex
      height="264px"
      justifyContent="center"
      alignItems="center"
      marginX="16px"
    >
      <BoxedIcon
        backgroundColor="opacityDefault.c10"
        borderColor="transparent"
        variant="circle"
        size={60}
        Icon={<Icons.CheckmarkCircleFill color="success.c60" size="L" />}
      />
      <Text variant="h5" textAlign="center" fontWeight="semiBold" marginTop="24px">
        {t("syncOnboarding.successStep.title", { productName })}
      </Text>
    </Flex>
  );
};

export default DeviceSeededSuccessPanel;
