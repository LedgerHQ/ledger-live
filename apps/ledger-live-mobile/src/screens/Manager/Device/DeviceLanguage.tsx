import {
  Flex,
  Icons,
  Text,
  Button,
  SelectableList,
  ScrollContainer,
} from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  idsToLanguage,
  Language,
} from "@ledgerhq/live-common/lib/types/languages";
import BottomModal from "../../../components/BottomModal";
type Props = {
  language: Language;
};

const DeviceLanguage: React.FC<Props> = ({ language }) => {
  const { t } = useTranslation();

  const [isChangeLanguageOpen, setIsChangeLanguageOpen] = useState(false);

  const closeChangeLanguageModal = useCallback(
    () => setIsChangeLanguageOpen(false),
    [setIsChangeLanguageOpen],
  );
  const openChangeLanguageModal = useCallback(
    () => setIsChangeLanguageOpen(true),
    [setIsChangeLanguageOpen],
  );

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  return (
    <>
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex flexDirection="row">
          <Icons.LanguageMedium size={24} color="neutral.c80" />
          <Text ml={2} color="neutral.c80">
            {t("deviceLocalization.language")}
          </Text>
        </Flex>
        <Button Icon={Icons.DropdownMedium} onPress={openChangeLanguageModal}>
          {t(`deviceLocalization.languages.${language}`)}
        </Button>
      </Flex>
      <BottomModal
        isOpened={isChangeLanguageOpen}
        onClose={closeChangeLanguageModal}
      >
        <Flex height="100%" justifyContent="space-between">
          <Flex flexShrink={1}>
            <Text variant="h1" textAlign="center">
              {t("deviceLocalization.deviceLanguage")}
            </Text>
            <ScrollContainer mt={5}>
              <SelectableList
                currentValue={selectedLanguage}
                onChange={setSelectedLanguage}
              >
                {Object.values(idsToLanguage).map(currentLanguage => {
                  const isCurrentDeviceLanguage = currentLanguage === language;
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
          <Button alignSelf="stretch" type="main" mt={5}>
          {t("deviceLocalization.changeLanguage")}
          </Button>
        </Flex>
      </BottomModal>
    </>
  );
};

export default DeviceLanguage;
