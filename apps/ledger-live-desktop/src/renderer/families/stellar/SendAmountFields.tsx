import React, { useState } from "react";
import { withTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import SendFeeMode from "./SendFeeMode";
import FeeField from "./FeeField";
import Box from "~/renderer/components/Box";
import { track } from "~/renderer/analytics/segment";
const Root = (props: any) => {
  const { transaction, trackProperties } = props;
  const { fees, networkInfo } = transaction;
  const isCustomFee = !fees.eq(networkInfo.fees);
  const [isCustomMode, setCustomMode] = useState(isCustomFee);
  const bridge = getAccountBridge(props.account);
  const onFeeModeChange = (isCustom: boolean) => {
    track("button_clicked", {
      ...trackProperties,
      button: "fee",
      isCustom,
      fees: networkInfo?.fees,
    });
    setCustomMode(isCustom);
    if (!isCustom) {
      props.updateTransaction(t =>
        bridge.updateTransaction(t, {
          fees: networkInfo.fees,
        }),
      );
    }
  };
  return (
    <>
      <SendFeeMode isCustomMode={isCustomMode} setCustomMode={onFeeModeChange} />
      {isCustomMode ? (
        <Box mb={10} horizontal grow>
          <FeeField {...props} />
        </Box>
      ) : null}
    </>
  );
};
export default {
  component: withTranslation()(Root),
  fields: [],
};
