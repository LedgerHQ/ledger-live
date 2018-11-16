// @flow

import React from "react";
import HeaderTitle from "../components/HeaderTitle";
import styles from "./styles";
import colors from "../colors";

export default {
  headerTransparent: true,
  headerStyle: [styles.header, styles.transparentHeader],
  headerTitle: (props: *) => (
    <HeaderTitle {...props} style={{ color: colors.white }} />
  ),
};
