import React from "react";
import type { EditExternalAddressJobState } from "@features/platform-contacts/device/intents";

type EditExternalAddressComponentLWDProps = Readonly<{
  jobState: EditExternalAddressJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// Temporary minimal renderer until the production Contacts UI lands.
export function EditExternalAddressComponentLWD({
  jobState,
}: EditExternalAddressComponentLWDProps) {
  return (
    <div className="flex w-full flex-col gap-8 p-16">
      <p className="body-2 text-base">
        {jobState === undefined
          ? "Preparing Contacts operation"
          : jobState.type === "awaiting-device-confirmation"
            ? `Confirm ${jobState.step} on your Ledger`
            : jobState.type}
      </p>
    </div>
  );
}
