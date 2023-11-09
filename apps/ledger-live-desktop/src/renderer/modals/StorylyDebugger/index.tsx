import React from "react";
import { Trans } from "react-i18next";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import { Box, Text, Flex } from "@ledgerhq/react-ui";
import Alert from "~/renderer/components/Alert";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import LanguageSelect from "~/renderer/screens/settings/sections/General/LanguageSelect";
import { StorylyBase } from "~/storyly";

const StorylyDebugger = () => {
  return (
    <Modal
      name="MODAL_STORYLY_DEBUGGER"
      centered
      render={({ onClose }: { onClose?: () => void }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="settings.experimental.features.testStories.title" />}
          noScroll
          render={() => (
            <ScrollArea>
              <Flex flexDirection="column" rowGap={4}>
                <Alert type="warning">
                  <Trans i18nKey="settings.experimental.features.testStories.longDesc" />
                </Alert>
                <LanguageSelect disableLanguagePrompt />
                {Object.entries(StorylyInstanceID).map(([key, instanceId]) => (
                  <Box key={key}>
                    <Text variant="paragraph">{key}</Text>
                    <StorylyBase {...{ instanceId }} />
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
