import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { track } from "~/renderer/analytics/segment";
import TabBar, { TabBarRootStyled } from "~/renderer/components/TabBar";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import swapRoutes from "./routes.json";

const Nav = styled.nav`
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
  ${TabBarRootStyled} {
    height: auto;
    margin-top: 3px;
  }
`;

/*
 ** This component manages routing logic for swap screens and send
 ** tracking data to analytics.
 */
const Navbar = () => {
  const { pathname } = useLocation();
  const history = useHistory();
  const { t } = useTranslation();
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const currentIndex = useMemo(() => {
    return swapRoutes.findIndex(route => route.path === pathname);
  }, [pathname]);
  const tabs = useMemo(
    () => swapRoutes.filter(route => !route.disabled).map(route => t(route.title)),
    [t],
  );

  const onWrappedTabChange = (nextIndex: number) => {
    track("button_clicked", {
      button: `${swapRoutes[nextIndex].name}`,
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
    if (currentIndex === nextIndex) return;
    const nextPathname = swapRoutes[nextIndex].path;
    history.push({
      pathname: nextPathname,
    });
  };

  if (currentIndex < 0 || currentIndex >= tabs.length) {
    return null;
  }

  return (
    <Nav>
      <TabBar tabs={tabs} onIndexChange={onWrappedTabChange} index={currentIndex} fontSize={14} />
    </Nav>
  );
};
export default Navbar;
