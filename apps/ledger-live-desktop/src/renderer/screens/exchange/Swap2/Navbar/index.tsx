import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Chip, Text } from "@ledgerhq/react-ui";
import { track } from "~/renderer/analytics/segment";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import swapRoutes from "./routes.json";

const Nav = styled.nav`
  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  font-size: 14px;
  line-height: 1em;
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
      <Chip onTabChange={onWrappedTabChange} initialActiveIndex={currentIndex}>
        {tabs.map((tab, idx) => (
          <Text key={tab} data-testid={`${tab}-tab-button`} data-active={currentIndex === idx}>
            {tab}
          </Text>
        ))}
      </Chip>
    </Nav>
  );
};
export default Navbar;
