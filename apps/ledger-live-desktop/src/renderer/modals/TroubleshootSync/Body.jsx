// @flow
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/context";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import TrackPage from "~/renderer/analytics/TrackPage";
import Button from "~/renderer/components/Button";

type Props = {
  onClose: () => void,
};

const Body = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const sync = useBridgeSync();
  const [status, setStatus] = useState("");

  useEffect(() => {
    function update() {
      const status = sync({ type: "GET_QUEUE_STATUS" });
      setStatus(JSON.stringify(status, null, 2));
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sync]);

  return (
    <ModalBody
      onClose={onClose}
      title={t("troubleshootSync.title")}
      render={() => (
        <Box relative style={{ height: 500 }} px={5} pb={8}>
          <TrackPage category="Modal" name="TroubleshootSync" />
          <textarea
            style={{ color: "black", font: "normal 10px monospace", width: "100%", height: "100%" }}
            value={status}
          />
        </Box>
      )}
      renderFooter={() => (
        <Box horizontal justifyContent="flex-end">
          <Button onClick={onClose} primary>
            {t("common.continue")}
          </Button>
        </Box>
      )}
    />
  );
};

export default Body;
