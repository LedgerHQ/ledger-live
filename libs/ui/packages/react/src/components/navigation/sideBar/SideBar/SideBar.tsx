import React, { useMemo, useState } from "react";
import { CSSTransition } from "react-transition-group";
import styled from "styled-components";
import SideBarContext from "../../../navigation/sideBar";
import Flex from "../../../layout/Flex";
import Item from "../../../navigation/sideBar/Item";
import Logo from "../../../navigation/sideBar/Logo";
import Toggle from "../../../navigation/sideBar/Toggle";

const Nav = styled(Flex)`
  position: relative;
  padding: ${p => `${p.theme.space[19]}px ${p.theme.space[5]}px 0`};
  row-gap: 1.5rem;
  height: 100vh;
  width: 14.875rem;
  color: ${props => props.theme.colors.neutral.c100};
  border-right: 1px solid ${props => props.theme.colors.neutral.c40};
  background-color: ${props => props.theme.colors.background.main};
  transition: width 200ms;
  will-change: width;
  flex-shrink: 0;
  z-index: ${p => p.theme.zIndexes[2]};

  &.nav-enter {
    width: ${p => p.theme.space[19]}px;
  }
  &.nav-enter-done {
    width: 14.875rem;
  }
  &.nav-exit {
    width: 14.875rem;
  }
  &.nav-exit-done {
    width: ${p => `${p.theme.space[19]}px`};
  }
`;

const TransparentMouseZone = styled.div`
  position: absolute;
  left: 100%;
  top: 0;
  width: ${p => `${p.theme.space[8]}px`};
  height: 100%;
`;

export type SideBarProps = {
  children: Array<JSX.Element>;
  onToggle: () => void;
  isExpanded?: boolean;
};

const SideBar = ({ children, onToggle, isExpanded = true }: SideBarProps): JSX.Element => {
  const [isToggleDisplayed, setToggleDisplayed] = useState(false);
  const providerValue = useMemo(() => ({ isExpanded, onToggle }), [isExpanded, onToggle]);

  return (
    <SideBarContext.Provider value={providerValue}>
      <CSSTransition in={isExpanded} timeout={200} classNames="nav">
        <Nav
          flexDirection="column"
          justifyContent="flex-start"
          alignContent="stretch"
          role="navigation"
          aria-label="Main"
          onMouseEnter={() => setToggleDisplayed(true)}
          onMouseLeave={() => setToggleDisplayed(false)}
        >
          <TransparentMouseZone />
          <Toggle isDisplayed={isToggleDisplayed} />
          <Logo />
          <Flex flexDirection="column" justifyContent="flex-start" alignContent="stretch">
            {children}
          </Flex>
        </Nav>
      </CSSTransition>
    </SideBarContext.Provider>
  );
};

SideBar.Item = Item;

export default SideBar;
