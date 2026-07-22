import React from "react";
import { useSelector } from "LLD/hooks/redux";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { useAleoViewKeyApproval } from "@ledgerhq/live-common/families/aleo/react";
import type { ViewKeysByAccountId } from "@ledgerhq/live-common/families/aleo/hw/getViewKey/index";
import { DeviceActionDefaultRendering } from "~/renderer/components/DeviceAction";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useKeepScreenAwake } from "~/renderer/hooks/useKeepScreenAwake";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { modularDialogSourceSelector } from "~/renderer/reducers/modularDialog";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { ADD_ACCOUNT_FLOW_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { ALEO_ADD_ACCOUNT_PAGE_NAME } from "./analytics/addAccount.types";
import { AleoTrackAddAccountScreen } from "./analytics/AleoTrackAddAccountScreen";
import { ViewKeyConfirmation } from "./ViewKeyConfirmation";

interface Props {
  selectedAccounts: Account[];
  currency: CryptoCurrency;
  onResult: (result: ViewKeysByAccountId) => void;
  onCancel: () => void;
}

export function ViewKeyApprove({ currency, selectedAccounts, onResult, onCancel }: Props) {
  const source = useSelector(modularDialogSourceSelector);
  const device = useSelector(getCurrentDevice);
  const isMock = getEnv("MOCK");

  const { hookState, payload, request, confirmedAccountIds, rejectedAccountIds } =
    useAleoViewKeyApproval({
      device,
      selectedAccounts,
      currency,
      ...(isMock && {
        connectAppExec: mockedEventEmitter,
        viewKeyExec: mockedEventEmitter,
      }),
    });

  useKeepScreenAwake(true);

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
