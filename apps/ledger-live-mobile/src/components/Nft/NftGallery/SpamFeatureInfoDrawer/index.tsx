import { FC } from "react";
import QueuedDrawer from "../../../QueuedDrawer";

import Button from "../../../wrappedUi/Button";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "react-i18next";
import { Image } from "react-native";
import styled from "@ledgerhq/native-ui/components/styled";
import src from "./img.png";
import { Dimensions } from "react-native";

const win = Dimensions.get("window");
interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const SpamFeatureInfoDrawer: FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  return (
    <QueuedDrawer isOpen={isOpen} onClose={onClose} noCloseButton>
      <Flex mb={4}>
        <Flex alignItems={"center"}>
          <StyledImage
            style={{
              width: win.width,
              height: win.width / 2.9,
            }}
            source={src}
          />
          <Text variant="h4" fontWeight="semiBold" color="neutral.c100" mt={5}>
            {t("notifications.spamFilter.title")}
          </Text>
          <Text
            variant="bodyLineHeight"
            fontWeight="medium"
            color="neutral.c70"
            textAlign="center"
            mt={3}
          >
            {t("notifications.spamFilter.desc")}
          </Text>
        </Flex>
        <Button type={"main"} mt={8} mb={7} onPress={onClose}>
          <Trans i18nKey="common.gotit" />
        </Button>
      </Flex>
    </QueuedDrawer>
  );
};

export default SpamFeatureInfoDrawer;

const StyledImage = styled(Image)`
  margin-top: 60px;
  margin-bottom: 20px
  margin-right: -24px;
  margin-left: -24px;
`;
