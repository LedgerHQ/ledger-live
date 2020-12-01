// @flow

import React, { PureComponent, memo } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";

import BottomModal from "./BottomModal";
import Circle from "./Circle";
import LText from "./LText";
import Button from "./Button";
import IconHelp from "../icons/Info";
import IconArrowRight from "../icons/ArrowRight";
import type { Props as ModalProps } from "./BottomModal";
import colors, { rgba } from "../colors";

type BulletItem = {
  key: string,
  val: React$Element<*>,
};

type InfoModalProps = ModalProps & {
  id?: string,
  title?: string | React$Element<*>,
  desc?: string | React$Element<*>,
  bullets?: BulletItem[],
  Icon?: React$ComponentType<*>,
  withCancel?: boolean,
  onContinue?: () => void,
  children?: React$Node,
  confirmLabel?: string,
  confirmProps?: *,
};

const InfoModal = ({
  isOpened,
  onClose,
  id,
  title,
  desc,
  bullets,
  Icon,
  withCancel,
  onContinue,
  children,
  confirmLabel,
  confirmProps,
  style,
  containerStyle,
}: InfoModalProps) => (
  <BottomModal
    id={id}
    isOpened={isOpened}
    onClose={onClose}
    style={[styles.modal, style || {}]}
  >
    <Circle bg={rgba(colors.live, 0.1)} size={56}>
      {Icon ? <Icon /> : <IconHelp size={24} color={colors.live} />}
    </Circle>
    {title ? (
      <LText style={styles.modalTitle} semiBold>
        {title}
      </LText>
    ) : null}

    {desc ? <LText style={styles.modalDesc}>{desc}</LText> : null}
    {bullets ? (
      <View style={styles.bulletsContainer}>
        {bullets.map(b => (
          <BulletLine key={b.key}>{b.val}</BulletLine>
        ))}
      </View>
    ) : null}
    <View
      style={[
        !title && !desc && !bullets ? styles.childrenContainer : null,
        containerStyle,
      ]}
    >
      {children}
    </View>

    <View style={styles.footer}>
      {withCancel ? (
        <Button
          event={(id || "") + "InfoModalClose"}
          type="secondary"
          title={<Trans i18nKey="common.cancel" />}
          containerStyle={[styles.modalBtn, styles.buttonContainerStyle]}
          onPress={onClose}
        />
      ) : null}
      <Button
        event={(id || "") + "InfoModalGotIt"}
        type="primary"
        title={confirmLabel || <Trans i18nKey="common.gotit" />}
        containerStyle={styles.modalBtn}
        onPress={onContinue || onClose}
        {...confirmProps}
      />
    </View>
  </BottomModal>
);

class BulletLine extends PureComponent<{ children: * }> {
  render() {
    const { children } = this.props;
    return (
      <View style={styles.bulletLine}>
        <IconArrowRight size={16} color={colors.smoke} />
        <LText style={styles.bulletLineText}>{children}</LText>
      </View>
    );
  }
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
    color: colors.darkBlue,
  },
  modalDesc: {
    textAlign: "center",
    color: colors.smoke,
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
    color: colors.smoke,
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
  modalBtn: {
    flex: 1,
  },
  buttonContainerStyle: {
    marginRight: 16,
  },
});

export default memo<InfoModalProps>(InfoModal);
