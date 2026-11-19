import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";
import { Pressable } from "react-native";

type Props = {
  onClose: () => void;
};

const HEADER_TOP = 16;
const HEADER_SIDE = 16;
const TITLE_LINE_HEIGHT = 24;
const SPACE_UNDER_TITLE = 24;
const CLOSE_BUTTON_PADDING = 12;
const CLOSE_ICON_SIZE = 16;
const CLOSE_BUTTON_SIZE = CLOSE_ICON_SIZE + 2 * CLOSE_BUTTON_PADDING;
// Centers the close button on the first line of the title.
const CLOSE_BUTTON_TOP = HEADER_TOP + (TITLE_LINE_HEIGHT - CLOSE_BUTTON_SIZE) / 2;
const SPACE_BESIDE_CLOSE_BUTTON = 8;
// Kept on both sides so the title stays centered and clear of the close button.
const TITLE_SIDE_MARGIN = CLOSE_BUTTON_SIZE + SPACE_BESIDE_CLOSE_BUTTON;

const DrawerHeader: React.FC<Props> = ({ onClose }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Flex
      width="100%"
      style={{
        paddingTop: HEADER_TOP,
        paddingHorizontal: HEADER_SIDE,
        paddingBottom: SPACE_UNDER_TITLE,
      }}
      testID="drawer-header"
    >
      <Text
        style={{ marginHorizontal: TITLE_SIDE_MARGIN }}
        fontSize={16}
        lineHeight={`${TITLE_LINE_HEIGHT}px`}
        fontWeight="semiBold"
        color={colors.neutral.c100}
        textAlign="center"
        testID="drawer-header-title"
      >
        {t("walletSync.synchronize.qrCode.title")}
      </Text>
      <Flex
        style={{ position: "absolute", top: CLOSE_BUTTON_TOP, right: HEADER_SIDE }}
        testID="drawer-header-close-container"
      >
        <Pressable onPressIn={onClose} hitSlop={16} testID="drawer-header-close">
          <Flex
            justifyContent="center"
            alignItems="center"
            style={{ padding: CLOSE_BUTTON_PADDING }}
            borderRadius={32}
            backgroundColor={colors.opacityDefault.c10}
          >
            <Icons.Close size="XS" color={colors.neutral.c100} />
          </Flex>
        </Pressable>
      </Flex>
    </Flex>
  );
};

export default DrawerHeader;
