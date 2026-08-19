import type { EditExternalAddressScopeJobState } from "./types";

type EditExternalAddressScopeComponentProps = Readonly<{
  jobState: EditExternalAddressScopeJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// WIP
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
