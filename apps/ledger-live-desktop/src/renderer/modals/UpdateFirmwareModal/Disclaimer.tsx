import { Flex, Alert, Divider, Button } from "@ledgerhq/react-ui";
import React from "react";
import { TFunction } from "react-i18next";
import { t } from "xstate";
import TrackPage from "~/renderer/analytics/TrackPage";
import Markdown, { Notes } from "~/renderer/components/Markdown";

type Props = {
  firmware: any;
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
        <Flex overflow="scroll" flex={1}>
          <div>
            <Notes>
              <Markdown>{firmware.osu.notes}</Markdown>
            </Notes>
          </div>
        </Flex>
      ) : null}
    </Flex>
    <Flex flexDirection="column" alignSelf="stretch">
      <Divider variant="light" />
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
          {t("common.continue")}
        </Button>
      </Flex>
    </Flex>
  </Flex>
);
export default Disclaimer;
