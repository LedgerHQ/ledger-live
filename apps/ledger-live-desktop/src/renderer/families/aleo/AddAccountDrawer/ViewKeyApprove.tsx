import React, { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import {
  type Request,
  type ViewKeysByAccountId,
} from "@ledgerhq/live-common/families/aleo/hw/getViewKey/index";
import { DeviceActionDefaultRendering } from "~/renderer/components/DeviceAction";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useKeepScreenAwake } from "~/renderer/hooks/useKeepScreenAwake";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";
import { ADD_ACCOUNT_FLOW_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { ALEO_ADD_ACCOUNT_PAGE_NAME } from "./analytics/addAccount.types";
import { AleoTrackAddAccountScreen } from "./analytics/AleoTrackAddAccountScreen";
import { useGetViewKeyAction } from "./useGetViewKeyAction";
import { ViewKeyConfirmation } from "./ViewKeyConfirmation";

interface Props {
  selectedAccounts: Account[];
  currency: CryptoCurrency;
  onResult: (result: ViewKeysByAccountId) => void;
  onCancel: () => void;
}

export function ViewKeyApprove({ currency, selectedAccounts, onResult, onCancel }: Props) {
  const source = useSelector(modularDrawerSourceSelector);
  const action = useGetViewKeyAction();

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
      <AleoTrackAddAccountScreen
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
}
