import React from "react";
import HeaderRightClose from "../components/HeaderRightClose";
import HeaderTitle from "../components/HeaderTitle";
import HeaderBackImage from "../components/HeaderBackImage";
import styles from "./styles";

export const defaultNavigationOptions = {
  headerStyle: styles.header,
  headerTitle: (props: any) => <HeaderTitle {...props} />,
  headerBackTitleVisible: false,
  headerBackImage: () => <HeaderBackImage />,
  headerTitleAllowFontScaling: false,
};

export const getStackNavigatorConfig = (c: any, closable: boolean = false) => ({
  ...defaultNavigationOptions,
  cardStyle: { backgroundColor: c.background.main || c.background },
  headerStyle: {
    backgroundColor: c.background.main || c.background,
    borderBottomColor: c.neutral?.c40 || c.white,
    // borderBottomWidth: 1,
    elevation: 0, // remove shadow on Android
    shadowOpacity: 0, // remove shadow on iOS
  },
  headerTitleAlign: "center",
  headerTitleStyle: {
    color: c.neutral?.c100 || c.darkBlue,
  },
  headerRight: closable ? () => <HeaderRightClose /> : undefined,
});
