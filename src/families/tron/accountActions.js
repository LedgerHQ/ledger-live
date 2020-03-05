// @flow
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import Button from "../../components/Button";
import Ellipsis from "../../icons/Ellipsis";

const ManageAction = ({
  // account,
  style,
}: {
  account: AccountLike,
  style: *,
}) => {
  const onPress = useCallback(() => {
    /** @TODO redirect to manage modal */
  }, []);

  return (
    <Button
      event="AccountManage"
      type="primary"
      IconLeft={Ellipsis}
      onPress={onPress}
      title={<Trans i18nKey="account.manage" />}
      containerStyle={style}
    />
  );
};

export default {
  ManageAction,
};
