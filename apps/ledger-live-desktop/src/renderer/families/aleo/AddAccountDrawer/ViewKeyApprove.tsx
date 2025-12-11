import React, { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  createAction,
  getViewKeyExec,
  type Request,
  type ActionResult,
} from "@ledgerhq/live-common/families/aleo/hw/getViewKey/index";
import { DeviceActionDefaultRendering } from "~/renderer/components/DeviceAction";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useKeepScreenAwake } from "~/renderer/hooks/useKeepScreenAwake";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";
import { ADD_ACCOUNT_FLOW_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { ALEO_ADD_ACCOUNT_PAGE_NAME } from "./analytics/addAccount.types";
import { TrackAleoAddAccountScreen } from "./analytics/TrackAleoAddAccountScreen";
import ViewKeyConfirmation from "./ViewKeyConfirmation";

interface Props {
  selectedAccounts: Account[];
  currency: CryptoCurrency;
  onResult: (result: ActionResult) => void;
  onCancel: () => void;
}

const ViewKeyApprove = ({ currency, selectedAccounts, onResult, onCancel }: Props) => {
  const source = useSelector(modularDrawerSourceSelector);
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  const action = createAction(
    getEnv("MOCK") ? mockedEventEmitter : connectApp({ isLdmkConnectAppEnabled }),
    getEnv("MOCK") ? mockedEventEmitter : getViewKeyExec,
  );

  const request: Request = useMemo(
    () => ({
      appName: "Aleo",
      selectedAccounts,
      currency,
    }),
    [currency, selectedAccounts],
  );

  const device = useSelector(getCurrentDevice);
  const hookState = action.useHook(device, request);
  const payload = action.mapResult(hookState);
  useKeepScreenAwake(true);

  const confirmedAccountIds = new Set(
    Object.entries(hookState.shareProgress.viewKeys)
      .filter(([_, viewKey]) => viewKey !== null)
      .map(([accountId]) => accountId),
  );

  const rejectedAccountIds = new Set(
    Object.entries(hookState.shareProgress.viewKeys)
      .filter(([_, viewKey]) => viewKey === null)
      .map(([accountId]) => accountId),
  );

  return (
    <>
      <TrackAleoAddAccountScreen
        page={ALEO_ADD_ACCOUNT_PAGE_NAME.VIEW_KEY_APPROVE}
        source={source}
        flow={ADD_ACCOUNT_FLOW_NAME}
      />
      <DeviceActionDefaultRendering
        location={HOOKS_TRACKING_LOCATIONS.addAccountModal}
        request={request}
        status={hookState}
        payload={payload}
        onResult={onResult}
      />
      {hookState.sharePending && (
        <ViewKeyConfirmation
          device={device}
          shared={hookState.shareProgress.completed}
          selectedAccounts={selectedAccounts}
          confirmedAccountIds={confirmedAccountIds}
          rejectedAccountIds={rejectedAccountIds}
          onCancel={onCancel}
        />
      )}
    </>
  );
};

export default ViewKeyApprove;
