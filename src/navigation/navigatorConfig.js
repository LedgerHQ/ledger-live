// @flow

import React from "react";
import HeaderRightClose from "../components/HeaderRightClose";
import HeaderTitle from "../components/HeaderTitle";
import HeaderBackImage from "../components/HeaderBackImage";
import styles from "./styles";

export const defaultNavigationOptions = {
  headerStyle: styles.header,
  headerTitle: (props: *) => <HeaderTitle {...props} />,
  headerBackTitleVisible: false,
  headerBackImage: () => <HeaderBackImage />,
  headerTitleAllowFontScaling: false,
};

export const getStackNavigatorConfig = (c: *, closable: boolean = false) => ({
  ...defaultNavigationOptions,
  cardStyle: { backgroundColor: c.white },
  headerTitleAlign: "center",
  headerTitleStyle: {
    color: c.darkBlue,
  },
  ...(closable ? { headerRight: () => <HeaderRightClose /> } : {}),
});
