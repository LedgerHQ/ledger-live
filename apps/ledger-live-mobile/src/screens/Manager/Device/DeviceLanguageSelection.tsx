import React from "react";
import {
  Button,
  Flex,
  Icons,
  ScrollContainer,
  SelectableList,
  Text,
} from "@ledgerhq/native-ui";
import { Language } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";

type Props = {
  deviceLanguage: Language;
  selectedLanguage: Language;
  availableLanguages: Language[];
  onSelectLanguage: (language: Language) => void;
  onConfirmInstall: () => void;
};

const DeviceLanguageSelection: React.FC<Props> = ({
  deviceLanguage,
  selectedLanguage,
  availableLanguages,
  onSelectLanguage,
  onConfirmInstall,
}) => {
  const { t } = useTranslation();

  return (
    <Flex height="100%" justifyContent="space-between">
      <Flex flexShrink={1}>
        <Text variant="h1" textAlign="center">
          {t("deviceLocalization.deviceLanguage")}
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
