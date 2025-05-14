import { Flex, Alert, Divider, Button, Text } from "@ledgerhq/react-ui";
import { FirmwareUpdateContext } from "@ledgerhq/types-live";
import React from "react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Markdown, { Notes } from "~/renderer/components/Markdown";

type Props = {
  firmware: FirmwareUpdateContext;
  onContinue(): void;
};

export default function Disclaimer({ firmware, onContinue }: Props) {
  const { t } = useTranslation();
  return (
    <Flex flex={1} flexDirection="column" justifyContent="space-between" overflowY="hidden">
      <Flex
        flex={1}
        flexDirection="column"
        alignItems="stretch"
        flexShrink={1}
        overflowY="hidden"
        px={23}
        my={12}
      >
        <TrackPage category="Manager" name="DisclaimerModal" />
        <Alert
          type="info"
          title={t("manager.firmware.prepareSeed")}
          renderContent={({ ...props }) => (
            <Text {...props}>{t("manager.firmware.prepareSeedRecover")}</Text>
          )}
        />
        {firmware && firmware.osu ? (
          <div style={{ overflow: "scroll", flex: 1, marginTop: "16px" }}>
            <Notes>
              <Markdown>{firmware.osu.notes as string}</Markdown>
            </Notes>
          </div>
        ) : null}
      </Flex>
      <Flex flexDirection="column" alignSelf="stretch">
        <Divider />
        <Flex
          px={12}
          alignSelf="stretch"
          flexDirection="row"
          justifyContent="space-between"
          pt={6}
          pb={1}
        >
          <Flex flex={1} />
          <Button data-testid="modal-continue-button" variant="main" onClick={onContinue}>
            {t("manager.firmware.installUpdate")}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
