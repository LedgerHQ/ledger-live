import { Text, Flex } from "@ledgerhq/native-ui";
import { CheckAloneMedium } from "@ledgerhq/native-ui/assets/icons";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import styled, { useTheme } from "styled-components/native";
import { setDateFormat } from "~/actions/settings";
import { track, TrackScreen } from "~/analytics";
import { Format } from "~/components/DateFormat/formatter.util";
import QueuedDrawer from "~/components/QueuedDrawer";
import { ScreenName } from "~/const";
import { dateFormatSelector } from "~/reducers/settings";

const drawerNameAnalytics = "Date Format selection";

type Props = {
  isOpen: boolean;
  closeModal: () => void;
};

export function DateFormatDrawer({ isOpen, closeModal }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const dateFormat = useSelector(dateFormatSelector);

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      drawer: drawerNameAnalytics,
    });
    closeModal();
  }, [closeModal]);

  const options = [
    {
      title: t("settings.display.DateFormatModal.default"),
      value: Format.default,
    },
    {
      title: t("settings.display.DateFormatModal.dayFirst"),
      value: Format.ddmmyyyy,
    },
    {
      title: t("settings.display.DateFormatModal.monthFirst"),
      value: Format.mmddyyyy,
    },
  ];

  const onClickRow = useCallback(
    (value: Format) => {
      dispatch(setDateFormat(value));
      track("button_clicked", {
        button: value,
        page: ScreenName.SettingsScreen,
        drawer: drawerNameAnalytics,
      });
      closeModal();
    },
    [closeModal, dispatch],
  );

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      preventBackdropClick
      title={t("settings.display.DateFormatModal.title")}
    >
      <TrackScreen category={drawerNameAnalytics} type="drawer" refreshSource={false} />
      {options.map((option, index) => (
        <Row
          title={option.title}
          key={option.title}
          onClickRow={() => onClickRow(option.value)}
          isSelected={dateFormat === option.value}
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
      <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
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
