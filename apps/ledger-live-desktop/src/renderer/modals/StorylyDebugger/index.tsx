import React from "react";
import { Trans } from "react-i18next";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import { Box, Text, Flex } from "@ledgerhq/react-ui";
import Alert from "~/renderer/components/Alert";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import LanguageSelect from "~/renderer/screens/settings/sections/General/LanguageSelect";

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
              <Flex flexDirection="column" rowGap={4}>
                <Alert type="warning">
                  {
                    "This is a tool provided as-is for the team to validate storyly stories used in the app."
                  }
                </Alert>
                <LanguageSelect disableLanguagePrompt />
                {Object.entries(StorylyInstanceID).map(([key]) => (
                  <Box key={key}>
                    <Text variant="paragraph">{key}</Text>
                  </Box>
                ))}
              </Flex>
            </ScrollArea>
          )}
        />
      )}
    />
  );
};

export default StorylyDebugger;
