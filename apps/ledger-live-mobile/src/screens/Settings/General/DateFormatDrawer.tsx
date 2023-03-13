import { Text, Flex } from "@ledgerhq/native-ui";
import { CheckAloneMedium } from "@ledgerhq/native-ui/assets/icons";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native-gesture-handler";
import styled, { useTheme } from "styled-components/native";
import { track, TrackScreen } from "../../../analytics";
import QueuedDrawer from "../../../components/QueuedDrawer";
import { ScreenName } from "../../../const";

const drawerNameAnalytics = "Date Format selection";

type Props = {
  isOpen: boolean;
  onCloseModal: () => void;
};

export function DateFormatDrawer({ isOpen, onCloseModal }: Props) {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const options = [
    {
      title: t("settings.display.DateFormatModal.default"),
    },
    {
      title: t("settings.display.DateFormatModal.dayFirst"),
    },
    {
      title: t("settings.display.DateFormatModal.monthFirst"),
    },
  ];

  const onClickRow = useCallback((index: number) => {
    setSelectedIndex(index);

    track("button_clicked", {
      button: "Date format",
      screen: ScreenName.SettingsScreen,
      drawer: drawerNameAnalytics,
    });
  }, []);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onCloseModal}
      preventBackdropClick
      title={t("settings.display.DateFormatModal.title")}
    >
      <TrackScreen
        category={drawerNameAnalytics}
        type="drawer"
        refreshSource={false}
      />
      {options.map((option, index) => (
        <Row
          title={option.title}
          onClickRow={() => onClickRow(index)}
          isSelected={selectedIndex === index}
          hasMarginBottom={options.length !== index + 1}
        />
      ))}
    </QueuedDrawer>
  );
}

type RowProps = {
  isSelected: boolean;
  title: string;
  onClickRow: () => void;
  hasMarginBottom: boolean;
};
const Row = ({ isSelected, title, onClickRow, hasMarginBottom }: RowProps) => {
  const { space } = useTheme();
  return (
    <TouchableOpacity
      onPress={onClickRow}
      style={{
        marginBottom: hasMarginBottom ? space[9] : 0,
      }}
    >
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Text
          fontSize="body"
          fontWeight="semiBold"
          color={isSelected ? "primary.c80" : "neutral.c100"}
        >
          {title}
        </Text>
        {isSelected ? (
          <Circle>
            <CheckAloneMedium size={16} color="background.drawer" />
          </Circle>
        ) : (
          <Empty />
        )}
      </Flex>
    </TouchableOpacity>
  );
};

const Circle = styled(Flex)`
  align-items: center;
  justify-content: center;
  border-radius: 50px;
  height: 24px;
  width: 24px;
  background-color: ${props => props.theme.colors.primary.c80};
`;
const Empty = styled(Flex)`
  height: 24px;
  width: 24px;
`;
