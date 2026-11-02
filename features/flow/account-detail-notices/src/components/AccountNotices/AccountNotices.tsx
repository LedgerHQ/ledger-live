import React from "react";
import type { AccountNoticesProps } from "./AccountNotices.types";
import { AccountNoticesView } from "./AccountNoticesView";
import { useAccountNoticesViewModel } from "./useAccountNoticesViewModel";

export function AccountNotices(props: AccountNoticesProps) {
  return <AccountNoticesView banners={useAccountNoticesViewModel(props)} testID={props.testID} />;
}
