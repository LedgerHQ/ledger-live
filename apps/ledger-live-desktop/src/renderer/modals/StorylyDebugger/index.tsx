import React from "react";
import { Trans } from "react-i18next";
import { StorylyWrapper, storyInstancesIDsMap } from "~/renderer/components/Storyly";
import { Box, Text } from "@ledgerhq/react-ui";
import Alert from "~/renderer/components/Alert";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";

const StorylyDebugger = ({ name }: { name: string }) => {
  return (
    <Modal
      name={name}
      centered
      render={({ onClose }: { onClose: void }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="settings.experimental.features.testStories.title" />}
          noScroll
          render={() => (
            <ScrollArea>
              <Alert type="warning">
                {
                  "This is a tool provided as-is for the team to validate storyly stories used in the app."
                }
              </Alert>
              {Object.keys(storyInstancesIDsMap).map(key => (
                <Box key={key}>
                  <Text variant="paragraph">{key}</Text>
                  <StorylyWrapper instanceID={storyInstancesIDsMap[key]} />
                </Box>
              ))}
            </ScrollArea>
          )}
        />
      )}
    />
  );
};

export default StorylyDebugger;
