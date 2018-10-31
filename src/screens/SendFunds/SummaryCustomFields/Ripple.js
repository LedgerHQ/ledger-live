/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";

import RippleTagRow from "./RippleTagRow";

type Props = {
  transaction: *,
  account: Account,
  navigation: NavigationScreenProp<*>,
};
export default function RippleCustom(props: Props) {
  return <RippleTagRow {...props} />;
}
