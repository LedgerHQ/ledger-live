import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BottomDrawer, Flex, Text } from "@ledgerhq/native-ui";

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
    <BottomDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title={t(
        `buyDevice.debugDrawers.message.${
          message?.type === "ledgerLiveOrderFail"
            ? "errorTitle"
            : "successTitle"
        }`,
      )}
      subtitle={t("buyDevice.debugDrawers.message.subtitle")}
    >
      <Text>
        {t("buyDevice.debugDrawers.message.type", { type: message?.type })}
      </Text>
      {message?.value ? (
        <Flex>
          <Text>
            {t("buyDevice.debugDrawers.message.deviceId", {
              deviceId: message?.value.deviceId,
            })}
          </Text>
          <Text>
            {t("buyDevice.debugDrawers.message.price", {
              price: message?.value.price,
            })}
          </Text>
          <Text>
            {t("buyDevice.debugDrawers.message.currency", {
              currency: message?.value.currency,
            })}
          </Text>
        </Flex>
      ) : (
        <Text>
          {t("buyDevice.debugDrawers.message.value", {
            value: message?.value,
          })}
        </Text>
      )}
    </BottomDrawer>
  );
};

export default DebugMessageDrawer;
