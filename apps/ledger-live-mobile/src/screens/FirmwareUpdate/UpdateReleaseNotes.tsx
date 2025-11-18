import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import Button from "~/components/wrappedUi/Button";
import SafeMarkdown from "~/components/SafeMarkdown";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SafeAreaViewFixed from "~/components/SafeAreaView";

type UpdateReleaseNotesProps = {
  firmwareNotes?: string | null;
  onContinue: () => void;
};

const UpdateReleaseNotes: React.FC<UpdateReleaseNotesProps> = ({ onContinue, firmwareNotes }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaViewFixed isFlex edges={["bottom"]} style={{ marginHorizontal: 16 }}>
      <ScrollView persistentScrollbar>
        <Flex px={6}>
          <Text variant="h4" fontWeight="semiBold" my={3}>
            {t("FirmwareUpdate.releaseNotesTitle")}
          </Text>
          {firmwareNotes ? <SafeMarkdown markdown={firmwareNotes} /> : null}
        </Flex>
      </ScrollView>
      <Button
        size="large"
        onPress={onContinue}
        type="main"
        style={Platform.OS === "android" ? { marginBottom: insets.bottom } : undefined}
      >
        {t("FirmwareUpdate.beginUpdate")}
      </Button>
    </SafeAreaViewFixed>
  );
};

export default UpdateReleaseNotes;
