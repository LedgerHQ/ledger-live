import type { EditExternalAddressJobState } from "./types";

type EditExternalAddressComponentProps = Readonly<{
  jobState: EditExternalAddressJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// WIP
export function EditExternalAddressComponent({ jobState }: EditExternalAddressComponentProps) {
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
