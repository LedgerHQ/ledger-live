import { useDropzone } from "react-dropzone";
import { Banner, Button, Spinner } from "@ledgerhq/lumen-ui-react";
import type { PortfolioError } from "../model/types";
import type { PortfolioStatus } from "../usePortfolioViewModel";

import { CloudUpload, FileDownload } from "@ledgerhq/lumen-ui-react/symbols";
type PnlPortfolioDropzoneProps = Readonly<{
  status: PortfolioStatus;
  onFiles: (files: File[]) => void;
  onReset: () => void;
}>;

export function PnlPortfolioDropzone({ status, onFiles, onReset }: PnlPortfolioDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFiles,
    accept: { "application/json": [".json"] },
    multiple: false,
    noClick: status.kind === "ready",
  });

  if (status.kind === "ready") {
    return (
      <div className="bg-muted/40 flex w-full items-center justify-between gap-16 rounded-32 px-20 py-16">
        <div className="flex min-w-0 items-center gap-12 text-base">
          <FileDownload size={24} />
          <div className="flex min-w-0 flex-col">
            <span className="body-3 ">Loaded file</span>
            <span className="body-2 truncate" title={status.fileName}>
              {status.fileName}
            </span>
          </div>
        </div>
        <Button appearance="no-background" size="sm" onClick={onReset}>
          Replace file
        </Button>
      </div>
    );
  }

  const isBusy = status.kind === "parsing" || status.kind === "loading-cv";

  return (
    <div className="flex flex-col gap-12">
      <div
        {...getRootProps()}
        className={`relative flex w-full flex-col items-center justify-center gap-12 overflow-hidden rounded-md border-2 border-dashed px-32 py-56 text-center transition-all duration-150 ${
          isBusy ? "cursor-progress" : "cursor-pointer"
        } ${
          isDragActive
            ? "border-active bg-active-subtle scale-[1.01]"
            : "border-muted hover:border-base hover:bg-muted/40"
        }`}
        aria-label="Drop your Ledger Live app.json here"
      >
        <input {...(getInputProps() as React.InputHTMLAttributes<HTMLInputElement>)} />

        <DropzoneStatus status={status} isDragActive={isDragActive} />
      </div>

      {status.kind === "error" ? (
        <Banner
          appearance="error"
          title={errorTitle(status.error.kind)}
          description={status.error.message}
        />
      ) : null}
    </div>
  );
}

type DropzoneStatusProps = Readonly<{
  status: PortfolioStatus;
  isDragActive: boolean;
}>;

function DropzoneStatus({ status, isDragActive }: DropzoneStatusProps) {
  if (status.kind === "parsing") {
    return (
      <div className="flex flex-col items-center gap-12">
        <Spinner size={32} />
        <span className="heading-5-semi-bold text-base">Parsing {status.fileName}…</span>
      </div>
    );
  }

  if (status.kind === "loading-cv") {
    return (
      <div className="flex flex-col items-center gap-12">
        <Spinner size={32} />
        <span className="heading-5-semi-bold text-base">
          Fetching counter-values for {status.accountsCount} account
          {status.accountsCount === 1 ? "" : "s"}…
        </span>
        <span className="body-3 text-muted">This may take a few seconds.</span>
      </div>
    );
  }

  return (
    <>
      <CloudUpload className={isDragActive ? "text-active" : "text-base"} size={24} />
      <div className="flex flex-col items-center gap-4">
        <span className="heading-5-semi-bold text-base">
          {isDragActive ? "Release to load your app.json" : "Drop your Ledger Live app.json here"}
        </span>
        <span className="body-3 text-muted">or click anywhere to browse</span>
      </div>
      <span className="body-3 text-muted mt-4 max-w-360">
        Exported from Ledger Live (Settings → Help → Save your Ledger Live data).
      </span>
    </>
  );
}

function errorTitle(kind: PortfolioError["kind"]): string {
  switch (kind) {
    case "encrypted":
      return "Encrypted app.json";
    case "invalid-json":
      return "Could not read file";
    case "missing-accounts":
      return "No accounts found";
    case "decode-all-failed":
      return "No supported accounts";
    case "countervalues-failed":
      return "Counter-values fetch failed";
  }
}
