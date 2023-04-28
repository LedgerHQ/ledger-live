import React, { useCallback } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import FlexBox, { FlexBoxProps } from "../Flex";
import Divider, { Props as DividerProps } from "../../asorted/Divider";
import Close from "@ledgerhq/icons-ui/react/CloseMedium";
import ArrowLeft from "@ledgerhq/icons-ui/react/ArrowLeftMedium";

import TransitionSlide from "../../transitions/TransitionSlide";
import TransitionInOut from "../../transitions/TransitionInOut";
import Text from "../../asorted/Text";
import Button from "../../cta/Button";

export enum Direction {
  Left = "left",
  Right = "right",
}

const Container = styled(FlexBox)`
  width: 100%;
  height: 100%;
  flex-direction: column;
`;

const Wrapper = styled(FlexBox)<{
  big?: boolean;
}>`
  height: 100%;
  width: ${(p) =>
    p.big ? p.theme.sizes.drawer.side.big.width : p.theme.sizes.drawer.side.small.width}px;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  z-index: ${(p) => p.theme.zIndexes[8]};
`;

const Overlay = styled.div<{ direction: Direction }>`
  display: flex;
  position: fixed;
  justify-content: ${(p) => (p.direction === Direction.Left ? "flex-end" : "flex-start")};
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  background-color: ${(p) => p.theme.colors.constant.overlay};
`;

const ScrollWrapper = styled(FlexBox)`
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ButtonPlaceholder = styled.div`
  min-width: ${(p) => p.theme.space[12]}px;
`;

export interface DrawerProps {
  isOpen: boolean;
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  big?: boolean;
  ignoreBackdropClick?: boolean;
  backgroundColor?: string;
  onClose: () => void;
  onBack?: () => void;
  setTransitionsEnabled?: (arg0: boolean) => void;
  hideNavigation?: boolean;
  menuPortalTarget?: Element | null;
  direction?: Direction;
  extraContainerProps?: Partial<FlexBoxProps>;
  extraHeaderProps?: Partial<FlexBoxProps>;
  extraFooterProps?: Partial<FlexBoxProps>;
  extraFooterDividerProps?: Partial<DividerProps>;
}

const DrawerContent = React.forwardRef(
  (
    {
      isOpen,
      title,
      children,
      footer,
      big,
      onClose,
      backgroundColor,
      setTransitionsEnabled = () => 0,
      onBack,
      extraContainerProps,
      extraHeaderProps,
      extraFooterProps,
      extraFooterDividerProps,
      ignoreBackdropClick = false,
      hideNavigation = true,
      direction = Direction.Left,
    }: DrawerProps,
    ref?: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const disableChildAnimations = useCallback(
      () => setTransitionsEnabled(false),
      [setTransitionsEnabled],
    );
    const enableChildAnimations = useCallback(
      () => setTransitionsEnabled(true),
      [setTransitionsEnabled],
    );

    const handleBackdropClick = useCallback(() => {
      if (!ignoreBackdropClick) {
        onClose();
      }
    }, [onClose, ignoreBackdropClick]);

    const stopClickPropagation = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    return (
      <TransitionInOut
        in={isOpen}
        appear
        mountOnEnter
        unmountOnExit
        onEntering={disableChildAnimations}
        onEntered={enableChildAnimations}
        onExiting={disableChildAnimations}
      >
        <Overlay direction={direction} onClick={handleBackdropClick} ref={ref}>
          <TransitionSlide
            in={isOpen}
            direction={direction}
            fixed
            reverseExit
            appear
            mountOnEnter
            unmountOnExit
          >
            <Wrapper
              big={big}
              onClick={stopClickPropagation}
              backgroundColor={backgroundColor ?? "background.main"}
            >
              <Container>
                <FlexBox
                  justifyContent="space-between"
                  alignItems="center"
                  p={12}
                  pb={10}
                  {...extraHeaderProps}
                >
                  {!hideNavigation && (
                    <>
                      {onBack != null ? (
                        <Button variant="neutral" onClick={onBack} Icon={ArrowLeft} />
                      ) : (
                        <ButtonPlaceholder />
                      )}
                    </>
                  )}
                  {(
                    <Text variant={"h3"} flex={1} textAlign="center">
                      {title}
                    </Text>
                  ) || <div />}
                  <FlexBox alignSelf="flex-start">
                    <Button variant="neutral" onClick={onClose} Icon={Close} />
                  </FlexBox>
                </FlexBox>
                <ScrollWrapper
                  flexDirection="column"
                  alignItems="stretch"
                  overflow="scroll"
                  position="relative"
                  p={12}
                  pt={0}
                  flex={1}
                  {...extraContainerProps}
                >
                  {children}
                </ScrollWrapper>
                {footer && (
                  <>
                    <Divider variant="light" {...extraFooterDividerProps} />
                    <FlexBox alignItems="center" py={8} px={12} {...extraFooterProps}>
                      {footer}
                    </FlexBox>
                  </>
                )}
              </Container>
            </Wrapper>
          </TransitionSlide>
        </Overlay>
      </TransitionInOut>
    );
  },
);

const Drawer = (
  { children, menuPortalTarget, ...sideProps }: DrawerProps,
  ref?: React.ForwardedRef<HTMLDivElement>,
): React.ReactElement => {
  const $root = React.useMemo(
    () =>
      menuPortalTarget === undefined && typeof document !== undefined
        ? document.querySelector("body")
        : menuPortalTarget,
    [menuPortalTarget],
  );
  if (!$root) {
    return (
      <DrawerContent ref={ref} {...sideProps}>
        {children}
      </DrawerContent>
    );
  } else {
    return ReactDOM.createPortal(
      <DrawerContent ref={ref} {...sideProps}>
        {children}
      </DrawerContent>,
      $root,
    );
  }
};

export default React.forwardRef(Drawer);
