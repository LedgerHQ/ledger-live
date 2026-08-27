import type { RenameLedgerAccountJobState } from "./types";

type RenameLedgerAccountComponentProps = Readonly<{
  jobState: RenameLedgerAccountJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// Temporary minimal renderer until the production Contacts UI lands.
export function RenameLedgerAccountComponent({ jobState }: RenameLedgerAccountComponentProps) {
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
