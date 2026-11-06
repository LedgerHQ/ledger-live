import React, { useCallback, useEffect, useState } from "react";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { Actionable } from "./Actionable";
import { ApiUrlPresets } from "./ApiUrlPresets";
import { LEDGER_SYNC_BACKENDS } from "../backends";

/** Edits the URL of one Ledger Sync API, with its staging and prod URLs as presets. */
export function AppSetApiUrl({
  buttonTitle,
  api,
  value,
  setValue,
}: Readonly<{
  buttonTitle: string;
  api: keyof typeof LEDGER_SYNC_BACKENDS.staging;
  value: string;
  setValue: (url: string) => void;
}>) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const apply = useCallback(
    (url: string) => {
      setLocalValue(url);
      setValue(url);
    },
    [setValue],
  );

  const action = useCallback(() => Promise.resolve(localValue), [localValue]);
  const editor = (
    <div className="flex min-w-0 flex-1 items-center gap-8">
      <ApiUrlPresets
        onStaging={() => apply(LEDGER_SYNC_BACKENDS.staging[api])}
        onProd={() => apply(LEDGER_SYNC_BACKENDS.prod[api])}
      />
      <TextInput
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className="min-w-0 flex-1"
      />
    </div>
  );
  return (
    <Actionable
      buttonTitle={buttonTitle}
      inputs={[]}
      action={action}
      value={value}
      setValue={v => setValue(v || LEDGER_SYNC_BACKENDS.staging[api])}
      valueDisplay={() => editor}
    />
  );
}
