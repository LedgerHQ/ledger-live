import { Flex, Alert, Divider, Button } from "@ledgerhq/react-ui";
import { FirmwareUpdateContext } from "@ledgerhq/types-live";
import React from "react";
import { TFunction } from "i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Markdown, { Notes } from "~/renderer/components/Markdown";

type Props = {
  firmware?: FirmwareUpdateContext;
  onContinue: () => void;
  t: TFunction;
};

const Disclaimer = ({ firmware, onContinue, t }: Props) => (
  <Flex flex={1} flexDirection="column" justifyContent="space-between" overflowY="hidden">
    <Flex
      flex={1}
      flexDirection="column"
      alignItems="stretch"
      flexShrink={1}
      overflowY="hidden"
      px={12}
      mt={12}
    >
      <TrackPage category="Manager" name="DisclaimerModal" />
      <Alert type="info" title={t("manager.firmware.prepareSeed")} />
      {firmware && firmware.osu ? (
        <div style={{ overflow: "scroll", flex: 1 }}>
          <Notes>
            {/*  */}
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
        pt={4}
        pb={1}
      >
        <Flex flex={1} />
        <Button data-test-id="modal-continue-button" variant="main" onClick={onContinue}>
          {t("manager.firmware.installUpdate")}
        </Button>
      </Flex>
    </Flex>
  </Flex>
);
export default Disclaimer;
