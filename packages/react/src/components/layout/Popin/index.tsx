import React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import baseStyled, { BaseStyledProps } from "../../styled";
import Button from "../../cta/Button";
import Close from "@ledgerhq/icons-ui/react/CloseRegular";
import TransitionInOut from "../../transitions/TransitionInOut";
import TransitionScale from "../../transitions/TransitionScale";

export type PopinProps = {
  isOpen: boolean;
  children: React.ReactNode;
  onClose?: () => void;
} & BaseStyledProps;

const Wrapper = baseStyled.div.attrs<BaseStyledProps, BaseStyledProps>((p) => ({
  height: p.height || p.theme.sizes.drawer.popin.min.height,
  width: p.width || p.theme.sizes.drawer.popin.min.width,
  minHeight: p.theme.sizes.drawer.popin.min.height,
  minWidth: p.theme.sizes.drawer.popin.min.width,
  maxHeight: Math.max(Number(p.height) || 0, p.theme.sizes.drawer.popin.max.height),
  maxWidth: Math.max(Number(p.width) || 0, p.theme.sizes.drawer.popin.max.width),
  padding: p.padding === undefined ? 6 : p.padding,
  position: "relative",
}))`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  z-index: ${(p) => p.theme.zIndexes[8]};
  background-color: ${(p) => p.theme.colors.palette.neutral.c50};
`;

const Overlay = styled.div`
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  background-color: ${(p) => p.theme.colors.palette.neutral.c100a07};
`;
const CloseButton = styled(Button)`
  position: absolute;
  top: ${(p) => p.theme.space[6]}px;
  right: ${(p) => p.theme.space[6]}px;
`;

const Popin = ({ isOpen, children, onClose = () => {}, ...props }: PopinProps) => (
  <TransitionInOut in={isOpen} appear mountOnEnter unmountOnExit>
    <Overlay>
      <TransitionScale in={isOpen} appear>
        <Wrapper {...props}>
          <CloseButton Icon={Close} onClick={onClose} />
          {children}
        </Wrapper>
      </TransitionScale>
    </Overlay>
  </TransitionInOut>
);

const PopinWrapper = ({ children, ...popinProps }: PopinProps): React.ReactElement => {
  const $root = React.useMemo(() => document.querySelector("#ll-popin-root"), []);
  if ($root === null) throw new Error("popin root cannot be found");
  return ReactDOM.createPortal(<Popin {...popinProps}>{children}</Popin>, $root);
};

export default PopinWrapper;
