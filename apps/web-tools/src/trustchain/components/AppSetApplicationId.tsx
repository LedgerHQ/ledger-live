import React, { useCallback, useEffect, useState } from "react";
import { Actionable } from "./Actionable";

const KNOWN_APPLICATIONS: { id: number; label: string }[] = [
  { id: 16, label: "16 — Ledger Sync" },
  { id: 17, label: "17 — wallet-cli ring" },
];

export function AppSetApplicationId({
  applicationId,
  setApplicationId,
}: {
  applicationId: number;
  setApplicationId: (applicationId: number) => void;
}) {
  const [local, setLocal] = useState(String(applicationId));
  useEffect(() => {
    setLocal(String(applicationId));
  }, [applicationId]);

  const action = useCallback(
    (value: string) => {
      const id = parseInt(value, 10);
      setApplicationId(id);
      return id;
    },
    [setApplicationId],
  );

  return (
    <Actionable
      buttonTitle="Set ApplicationId"
      inputs={String(applicationId) !== local ? [local] : null}
      action={action}
      value={applicationId}
      setValue={v => setApplicationId(v ?? applicationId)}
      valueDisplay={v => `m/0'/${v}'/…`}
    >
      <select
        className="flex-1 bg-base border border-base rounded-md px-8 py-6 body-2 text-base"
        value={local}
        onChange={e => setLocal(e.target.value)}
      >
        {KNOWN_APPLICATIONS.map(a => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
    </Actionable>
  );
}
