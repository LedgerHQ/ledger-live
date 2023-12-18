import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";

import { useTheme } from "styled-components/native";
import { IconsLegacy, IconBox, Flex } from "@ledgerhq/native-ui";
import type { Props as IconBoxProps } from "@ledgerhq/native-ui/components/Icon/IconBox";
import QueuedDrawer from "./QueuedDrawer";
import LText from "./LText";
import IconArrowRight from "~/icons/ArrowRight";
import type { Props as ModalProps } from "./QueuedDrawer";
import Button, { WrappedButtonProps } from "./wrappedUi/Button";
import { Merge } from "~/types/helpers";

type BulletItem = {
  key: string;
  val: React.ReactNode;
};

type InfoModalProps = Merge<
  Omit<ModalProps, "isRequestingToBeOpened">,
  {
    isOpened: boolean;
    id?: string;
    title?: React.ReactNode;
    desc?: React.ReactNode;
    bullets?: BulletItem[];
    Icon?: IconBoxProps["Icon"];
    withCancel?: boolean;
    onContinue?: () => void;
    children?: React.ReactNode;
    confirmLabel?: React.ReactNode;
    confirmProps?: WrappedButtonProps;
  }
>;

const InfoModal = ({
  isOpened,
  onClose,
  id,
  title,
  desc,
  bullets,
  Icon = IconsLegacy.InfoMedium,
  withCancel,
  onContinue,
  children,
  confirmLabel,
  confirmProps,
  style,
  containerStyle,
}: InfoModalProps) => (
  <QueuedDrawer
    isRequestingToBeOpened={isOpened}
    onClose={onClose}
    style={[styles.modal, style || {}]}
  >
    <Flex alignItems="center">
      <IconBox Icon={Icon} color="primary.c80" boxSize={64} iconSize={24} />
      {title ? (
        <LText style={styles.modalTitle} semiBold>
          {title}
        </LText>
      ) : null}

      {desc ? (
        <LText style={styles.modalDesc} color="smoke">
          {desc}
        </LText>
      ) : null}
      {bullets ? (
        <View style={styles.bulletsContainer}>
          {bullets.map(b => (
            <BulletLine key={b.key}>{b.val}</BulletLine>
          ))}
        </View>
      ) : null}
      <View style={[!title && !desc && !bullets ? styles.childrenContainer : null, containerStyle]}>
        {children}
      </View>
    </Flex>

    <Flex pt={6}>
      {withCancel ? (
        <Button event={(id || "") + "InfoModalClose"} type={undefined} onPress={onClose} mt={7}>
          <Trans i18nKey="common.cancel" />
        </Button>
      ) : null}
      <Button
        event={(id || "") + "InfoModalGotIt"}
        type="main"
        onPress={onContinue || onClose}
        {...confirmProps}
        mt={7}
      >
        {confirmLabel || <Trans i18nKey="common.gotit" />}
      </Button>
    </Flex>
  </QueuedDrawer>
);

function BulletLine({ children }: { children?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bulletLine}>
      <IconArrowRight size={16} color={colors.neutral.c70} />
      <LText style={styles.bulletLineText} color={colors.neutral.c70}>
        {children}
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: "center",
  },
  modalTitle: {
    marginVertical: 16,
    fontSize: 14,
    lineHeight: 21,
  },
  modalDesc: {
    textAlign: "center",

    marginBottom: 24,
  },
  bulletsContainer: {
    alignSelf: "flex-start",
  },
  bulletLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletLineText: {
    marginLeft: 4,
    textAlign: "left",
  },
  childrenContainer: {
    paddingTop: 24,
  },
  footer: {
    alignSelf: "stretch",
    paddingTop: 24,
    flexDirection: "row",
  },
});

export default memo<InfoModalProps>(InfoModal);
