import React from "react";
import styled from "styled-components";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import IconCross from "~/renderer/icons/Cross";
import { Base as Button } from "./Button";
import IconAngleLeft from "~/renderer/icons/AngleLeft";
import Text from "./Text";
import { Trans } from "react-i18next";
import Box from "./Box/Box";

const TouchButton = styled.button`
  border: none;
  background-color: rgba(0, 0, 0, 0);
  display: inline-flex;
  max-height: 100%;
  -webkit-app-region: no-drag;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  color: ${p => p.theme.colors.neutral.c80};
  transition: filter 150ms ease-out;
  cursor: pointer;
  :hover {
    filter: opacity(0.8);
  }
  :active {
    filter: opacity(0.5);
  }
`;

type Props = {
  title?: string;
  onRequestClose?: (a: React.MouseEvent<Element, MouseEvent>) => void;
  onRequestBack?: (a: React.MouseEvent<Element, MouseEvent>) => void;
  closeButtonComponent?: React.ComponentType<{
    onRequestClose: (mouseEvent: React.MouseEvent<Element, MouseEvent>) => void;
  }>;
};
const SideDrawerHeader = ({
  title,
  onRequestClose,
  onRequestBack,
  closeButtonComponent,
}: Props) => {
  const blocked = useDeviceBlocked();

  const hasOnlyCloseButton = !onRequestBack && !title && onRequestClose;

  const renderCloseButton = () => {
    if (closeButtonComponent && onRequestClose && !blocked) {
      return React.createElement(closeButtonComponent, {
        onRequestClose,
      });
    } else if (onRequestClose && !blocked) {
      return (
        <TouchButton onClick={onRequestClose} data-testid="drawer-close-button">
          <IconCross size={16} />
        </TouchButton>
      );
    }
    return <Box />;
  };

  return (
    <>
      {onRequestClose || onRequestBack || title ? (
        <Box
          horizontal
          justifyContent="space-between"
          height={62}
          alignItems="center"
          m={0}
          width={hasOnlyCloseButton ? "fit-content" : "100%"}
          alignSelf={hasOnlyCloseButton ? "flex-end" : "auto"}
          p="24px"
          style={{
            zIndex: 200,
          }}
        >
          {onRequestBack ? (
            <Button onClick={onRequestBack} data-testid="drawer-close-button">
              <IconAngleLeft size={12} />
              <Text ff="Inter|Medium" fontSize={4} color="neutral.c60">
                <Trans i18nKey="common.back" />
              </Text>
            </Button>
          ) : (
            <Box />
          )}
          {title && (
            <Text ff="Inter|SemiBold" fontWeight="600" fontSize="18px">
              {title}
            </Text>
          )}
          {renderCloseButton()}
        </Box>
      ) : null}
    </>
  );
};

export default SideDrawerHeader;
