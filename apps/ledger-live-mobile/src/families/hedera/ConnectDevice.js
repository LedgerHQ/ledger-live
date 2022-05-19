// @flow
import React  from "react";
import { useSelector } from "react-redux";

import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";

import type { AccountLike } from "@ledgerhq/live-common/lib/types";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  account?: AccountLike,
  accountId: string,
  parentId?: string,
  title: string,
  appName?: string,
  onSuccess?: () => void,
  onError?: () => void,
};

export default function ConnectDevice({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));
  if (!account) return;
  
  // skip verifying device
  navigation.navigate(ScreenName.ReceiveConfirmation, {
    ...route.params,
  });

  return null;
}
