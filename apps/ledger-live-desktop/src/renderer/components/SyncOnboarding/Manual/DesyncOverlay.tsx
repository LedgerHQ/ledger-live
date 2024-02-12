import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, InfiniteLoader, Alert } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsFlowName } from "./shared";

type Props = {
  isOpen: boolean;
  delay?: number;
  productName: string;
};

export const DesyncOverlay = ({ isOpen, delay = 0, productName }: Props) => {
  const { t } = useTranslation();

  const [showContent, setShowContent] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setShowContent(true);
      }, delay);
    }
  }, [isOpen, delay]);

  useEffect(() => {
    if (!isOpen) {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen || !showContent) {
    return null;
  }

  return (
    <Flex
      zIndex={100}
      position="absolute"
      top={0}
      left={0}
      height="100%"
      width="100%"
      flexDirection="column"
      backgroundColor="constant.overlay"
    >
      <TrackPage
        category="device connection lost"
        type="modal"
        flow={analyticsFlowName}
        error="device connection lost"
        refreshSource={false}
      />
      <Flex alignItems="flex-end" justifyContent="center" flex={1} padding={4}>
        <Alert
          type="warning"
          title={t("syncOnboarding.manual.desyncOverlay.errorMessage", {
            deviceName: productName,
          })}
          containerProps={{
            width: 480,
          }}
          renderRight={() => (
            <Flex pl={6}>
              <InfiniteLoader color="neutral.c100" size={24} />
            </Flex>
          )}
        ></Alert>
      </Flex>
    </Flex>
  );
};
