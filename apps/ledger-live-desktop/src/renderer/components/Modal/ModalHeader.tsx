import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Tabbable from "~/renderer/components/Box/Tabbable";
import IconCross from "~/renderer/icons/Cross";
import IconAngleLeft from "~/renderer/icons/AngleLeft";
const TitleContainer = styled(Box)<{
  color?: string;
  right?: boolean;
}>`
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
`;
const ModalTitle = styled(Box).attrs(() => ({
  color: "palette.text.shade100",
  ff: "Inter|Medium",
  fontSize: 6,
}))`
  text-align: center;
  line-height: 1;
`;
const ModalSubTitle = styled(Box).attrs(() => ({
  color: "palette.text.shade50",
  ff: "Inter|Regular",
  fontSize: 3,
}))`
  text-align: center;
  line-height: 2;
`;
const ModalHeaderAction = styled(Tabbable).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  fontSize: 3,
  p: 3,
}))<{ right?: boolean }>`
  border-radius: 8px;
  color: ${p => p.color || p.theme.colors.palette.text.shade60};
  top: 0;
  align-self: ${p => (p.right ? "flex-end" : "flex-start")};
  line-height: 0;
  ${p =>
    p.onClick
      ? `
    cursor: pointer;

    &:hover,
    &:hover ${Text} {
      color: ${p.theme.colors.palette.text.shade80};
    }

    &:active,
    &:active ${Text} {
      color: ${p.theme.colors.palette.text.shade100};
    }

    ${Text} {
      border-bottom: 1px dashed transparent;
    }
    &:focus span {
      border-bottom-color: none;
    }
  `
      : ""}
`;
const Container = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  justifyContent: "space-between",
  p: 2,
  relative: true,
}))<{
  hasTitle?: boolean;
}>`
  min-height: ${p => (p.hasTitle ? 66 : 0)}px;
`;
const ModalHeader = ({
  children,
  subTitle,
  onBack,
  backButtonComponent,
  onClose,
  style = {},
}: {
  children?: React.ReactNode;
  subTitle?: React.ReactNode;
  onBack?: (e?: React.SyntheticEvent) => void;
  onClose?: (e?: React.SyntheticEvent) => void;
  style?: React.CSSProperties;
  backButtonComponent?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <Container hasTitle={Boolean(children || subTitle)} style={style}>
      {onBack ? (
        <ModalHeaderAction onClick={onBack} data-testid="modal-back-button">
          <IconAngleLeft size={12} />
          {backButtonComponent || (
            <Text ff="Inter|Medium" fontSize={4} color="palette.text.shade40">
              {t("common.back")}
            </Text>
          )}
        </ModalHeaderAction>
      ) : (
        <div />
      )}
      {children || subTitle ? (
        <TitleContainer>
          {subTitle && <ModalSubTitle data-id="modal-subtitle">{subTitle}</ModalSubTitle>}
          <ModalTitle data-testid="modal-title">{children}</ModalTitle>
        </TitleContainer>
      ) : null}
      {onClose ? (
        // @ts-expect-error it is complicated to override styled-components prop types - right is supposed to be a string and inherited from Tabbable
        <ModalHeaderAction right onClick={onClose} data-testid="modal-close-button">
          <IconCross size={16} />
        </ModalHeaderAction>
      ) : (
        <div />
      )}
    </Container>
  );
};
export default ModalHeader;
