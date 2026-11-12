import React, { Suspense } from "react";
import { useSelector } from "LLD/hooks/redux";
import { receiveAddressDialogSelector } from "~/renderer/reducers/receiveFlow";
import { selectAccountEntry } from "../../receiveAccount";
import { ReceiveAddressDialogView } from "./ReceiveAddressDialogView";
import {
  useReceiveAddressDialogViewModel,
  type ReceiveAddressDialogTarget,
} from "./useReceiveAddressDialogViewModel";

function ReceiveAddressDialog(props: ReceiveAddressDialogTarget) {
  return <ReceiveAddressDialogView {...useReceiveAddressDialogViewModel(props)} />;
}

/** Mounted once in `GlobalDialogs`; opened through `openReceiveFlow`. */
export default function ReceiveAddressDialogRoot() {
  const payload = useSelector(receiveAddressDialogSelector);
  const entry = useSelector(state =>
    payload ? selectAccountEntry(state, payload.accountUUID) : undefined,
  );
  if (!payload || !entry) return null;

  return (
    // The family module is loaded on demand: `useLLDCoinFamily` suspends on first use.
    <Suspense fallback={null}>
      <ReceiveAddressDialog
        key={`${payload.accountUUID}:${payload.assetId}`}
        entry={entry}
        assetId={payload.assetId}
        source={payload.source}
      />
    </Suspense>
  );
}
