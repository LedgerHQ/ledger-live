import React, { useState, useCallback, useMemo } from "react";
import styled from "styled-components";

import Text from "../../asorted/Text";
import FlexBox from "../../layout/Flex";
import BreadcrumbComponent, { Props } from "./index";

export default {
  title: "Navigation/Breadcrumb",
  component: BreadcrumbComponent,
};

type Route = {
  path: string;
  label: string;
  routes?: Route[];
};
const routes: Route[] = [
  {
    path: "settings",
    label: "Settings",
    routes: [
      { path: "experimental", label: "Experimental" },
      { path: "developer", label: "Developer" },
    ],
  },
  {
    path: "account",
    label: "Account",
    routes: [{ path: "user", label: "User", routes: [{ path: "edit", label: "Edit" }] }],
  },
  {
    path: "apps",
    label: "Applications",
    routes: [
      { path: "buy", label: "Buy" },
      { path: "sell", label: "Sell" },
      { path: "swap", label: "Swap", routes: [{ path: "confirm", label: "Confirm" }] },
    ],
  },
];

const RouteElement = styled.div`
  :hover {
    text-decoration: underline;
  }
`;
const Routes = ({
  onClick,
  routes,
  previousPath = [],
}: {
  onClick: (path: string) => void;
  routes?: Route[];
  previousPath?: string[];
}): JSX.Element | null => {
  if (!routes || routes.length === 0) return null;

  return (
    <div style={{ paddingLeft: "1em" }}>
      {routes.map(route => (
        <>
          <RouteElement onClick={() => onClick([...previousPath, route.path].join("/"))}>
            {route.label} [{"/" + route.path}]
          </RouteElement>
          <Routes
            routes={route.routes}
            previousPath={[...previousPath, route.path]}
            onClick={onClick}
          />
        </>
      ))}
    </div>
  );
};

export const Breadcrumb = (args: Props): JSX.Element => {
  const [route, setRoute] = useState("apps/swap/confirm");

  const onChange = useCallback(value => setRoute(value.join("/")), [setRoute]);
  const segments = useMemo(() => {
    const paths = route.split("/");

    const [, result] = paths.reduce<[Route[], React.ComponentProps<typeof Breadcrumb>["segments"]]>(
      ([routes, result], path) => {
        let activeRoute: Route | null = null;
        const level = routes.map(route => {
          if (route.path === path) {
            activeRoute = route;
          }
          return {
            value: route.path,
            label: route.label,
          };
        });

        if (!activeRoute) {
          throw new Error("Cannot match path.");
        }

        const nextRoutes = (activeRoute as Route).routes || [];
        if (level.length === 1) {
          result.push(level[0]);
        } else {
          result.push({
            options: level,
            value: {
              value: (activeRoute as Route).path,
              label: (activeRoute as Route).label,
            },
          });
        }

        return [nextRoutes, result];
      },
      [routes, []],
    );
    return result;
  }, [route]);

  return (
    <FlexBox rowGap={3} flexDirection="column">
      <BreadcrumbComponent {...args} segments={segments} onChange={onChange} />
      <hr />
      <Text fontWeight="medium" variant={"paragraph"}>
        Current route: /{route}
      </Text>
      <Text fontWeight="medium" variant={"paragraph"}>
        Available routes:
      </Text>
      <Text fontWeight="regular" variant={"paragraph"} style={{ cursor: "pointer" }}>
        <Routes routes={routes} onClick={setRoute} />
      </Text>
    </FlexBox>
  );
};
