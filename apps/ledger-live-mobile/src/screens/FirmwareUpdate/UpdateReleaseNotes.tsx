import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import Button from "../../components/wrappedUi/Button";
import SafeMarkdown from "../../components/SafeMarkdown";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

type UpdateReleaseNotesProps = {
  firmwareNotes?: string | null;
  onContinue: () => void;
};

const UpdateReleaseNotes: React.FC<UpdateReleaseNotesProps> = ({ onContinue, firmwareNotes }) => {
  const { t } = useTranslation();

  return (
    <Flex flex={1} px={7} pb={7}>
      <ScrollView persistentScrollbar>
        <Flex px={3}>
          <Text variant="h4" fontWeight="semiBold" mb={4}>
            {t("FirmwareUpdate.releaseNotesTitle")}
          </Text>
          {firmwareNotes ? <SafeMarkdown markdown={firmwareNotes} /> : null}
        </Flex>
      </ScrollView>
      <Button onPress={onContinue} type="main">
        {t("FirmwareUpdate.beginUpdate")}
      </Button>
    </Flex>
  );
};

export default UpdateReleaseNotes;
