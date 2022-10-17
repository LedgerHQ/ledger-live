import React from "react";
import {
  Button,
  Flex,
  Icons,
  ScrollContainer,
  SelectableList,
  Text,
} from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Language } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";

type Props = {
  deviceLanguage: Language;
  selectedLanguage: Language;
  availableLanguages: Language[];
  device: Device;
  onSelectLanguage: (language: Language) => void;
  onConfirmInstall: () => void;
};

const DeviceLanguageSelection: React.FC<Props> = ({
  deviceLanguage,
  selectedLanguage,
  availableLanguages,
  device,
  onSelectLanguage,
  onConfirmInstall,
}) => {
  const { t } = useTranslation();

  const deviceName = getDeviceModel(device.modelId).productName;

  return (
    <Flex height="100%" justifyContent="space-between">
      <Flex flexShrink={1}>
        <Text variant="h4" textAlign="center">
          {t("deviceLocalization.language")}
        </Text>
        <Text variant="paragraph" mb={2} mt={5} color="neutral.c70">
          {t("deviceLocalization.chooseLanguage", { deviceName })}
        </Text>
        <ScrollContainer mt={5}>
          <SelectableList
            currentValue={selectedLanguage}
            onChange={onSelectLanguage}
          >
            {availableLanguages.map(currentLanguage => {
              const isCurrentDeviceLanguage =
                currentLanguage === deviceLanguage;
              return (
                <SelectableList.Element
                  value={currentLanguage}
                  renderRight={() =>
                    isCurrentDeviceLanguage ? (
                      <Icons.CircledCheckSolidMedium
                        color="primary.c80"
                        size={24}
                      />
                    ) : null
                  }
                >
                  {t(`deviceLocalization.languages.${currentLanguage}`)}
                </SelectableList.Element>
              );
            })}
          </SelectableList>
        </ScrollContainer>
      </Flex>
      <Button
        alignSelf="stretch"
        type="main"
        mt={5}
        onPress={onConfirmInstall}
        disabled={selectedLanguage === deviceLanguage}
      >
        {t("deviceLocalization.changeLanguage")}
      </Button>
    </Flex>
  );
};

export default DeviceLanguageSelection;
