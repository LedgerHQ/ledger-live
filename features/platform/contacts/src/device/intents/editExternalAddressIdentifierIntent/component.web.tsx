import type { EditExternalAddressIdentifierJobState } from "./types";

type EditExternalAddressIdentifierComponentProps = Readonly<{
  jobState: EditExternalAddressIdentifierJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// Temporary minimal renderer until the production Contacts UI lands.
export function EditExternalAddressIdentifierComponent({
  jobState,
}: EditExternalAddressIdentifierComponentProps) {
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
