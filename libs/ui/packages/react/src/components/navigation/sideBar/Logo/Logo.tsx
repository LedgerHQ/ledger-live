import React, { useContext } from "react";
import styled from "styled-components";

import LedgerLiveIconLarge from "../../../../assets/logos/LedgerLiveRegular";
import LedgerIconSmall from "../../../../assets/logos/LedgerLiveAltRegular";
import SideBarContext from "../../../navigation/sideBar";
import TransitionInOut from "../../../transitions/TransitionInOut";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  overflow: hidden;
`;

const Logo = (): JSX.Element => {
  const { isExpanded } = useContext(SideBarContext);

  return (
    <Container>
      <TransitionInOut
        timeout={300}
        in={isExpanded}
        unmountOnExit
        mountOnEnter
        style={{ transitionDelay: "300ms", marginLeft: "1rem" }}
      >
        <LedgerLiveIconLarge />
      </TransitionInOut>
      <TransitionInOut
        timeout={300}
        in={!isExpanded}
        unmountOnExit
        mountOnEnter
        style={{ margin: "auto", transitionDelay: "300ms" }}
      >
        <LedgerIconSmall />
      </TransitionInOut>
    </Container>
  );
};

export default Logo;
