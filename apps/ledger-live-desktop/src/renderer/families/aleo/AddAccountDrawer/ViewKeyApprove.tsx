import React from "react";
import { AleoTrackAddAccountScreen } from "~/renderer/families/aleo/AddAccountDrawer/analytics/AleoTrackAddAccountScreen";
import { ALEO_ADD_ACCOUNT_PAGE_NAME } from "~/renderer/families/aleo/AddAccountDrawer/analytics/addAccount.types";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";
import { ADD_ACCOUNT_FLOW_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { useSelector } from "LLD/hooks/redux";

export function ViewKeyApprove() {
  const source = useSelector(modularDrawerSourceSelector);

  return (
    <>
      <AleoTrackAddAccountScreen
        page={ALEO_ADD_ACCOUNT_PAGE_NAME.VIEW_KEY_APPROVE}
        source={source}
        flow={ADD_ACCOUNT_FLOW_NAME}
      />
      view key approve step
    </>
  );
}
