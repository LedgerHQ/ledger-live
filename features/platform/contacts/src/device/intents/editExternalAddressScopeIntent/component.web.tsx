import type { EditExternalAddressScopeJobState } from "./types";

type EditExternalAddressScopeComponentProps = Readonly<{
  jobState: EditExternalAddressScopeJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// Temporary minimal renderer until the production Contacts UI lands.
export function EditExternalAddressScopeComponent({
  jobState,
}: EditExternalAddressScopeComponentProps) {
  return (
    <div className="flex w-full flex-col gap-8 p-16">
      <p className="body-2 text-base">
        {jobState === undefined
          ? "Preparing Contacts operation"
          : jobState.type === "awaiting-device-confirmation"
            ? "Confirm on your Ledger"
            : jobState.type}
      </p>
    </div>
  );
}
