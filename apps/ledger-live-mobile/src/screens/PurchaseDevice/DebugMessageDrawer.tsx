import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";

import QueuedDrawer from "../../components/QueuedDrawer";
import { PurchaseMessage } from "./types";

export type Props = {
  isOpen: boolean;
  message?: PurchaseMessage | null;
  onClose: () => void;
};

const DebugMessageDrawer = ({ isOpen, message, onClose }: Props) => {
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      title={t(
        `purchaseDevice.debugDrawers.message.${
          message?.type === "ledgerLiveOrderFail"
            ? "errorTitle"
            : "successTitle"
        }`,
      )}
      subtitle={t("purchaseDevice.debugDrawers.message.subtitle")}
    >
      <Text>
        {t("purchaseDevice.debugDrawers.message.type", { type: message?.type })}
      </Text>
      {message?.value ? (
        <Flex>
          <Text>
            {t("purchaseDevice.debugDrawers.message.deviceId", {
              deviceId: message?.value.deviceId,
            })}
          </Text>
          <Text>
            {t("purchaseDevice.debugDrawers.message.price", {
              price: message?.value.price,
            })}
          </Text>
          <Text>
            {t("purchaseDevice.debugDrawers.message.currency", {
              currency: message?.value.currency,
            })}
          </Text>
        </Flex>
      ) : (
        <Text>
          {t("purchaseDevice.debugDrawers.message.value", {
            value: message?.value,
          })}
        </Text>
      )}
    </QueuedDrawer>
  );
};

export default DebugMessageDrawer;
