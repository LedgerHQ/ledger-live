import React, { useCallback } from "react";
import { setEnv } from "@ledgerhq/live-env";
import { Actionable } from "./Actionable";
import useEnv from "../useEnv";

export function AppMockEnv() {
  const mockEnv = useEnv("MOCK");
  const action = useCallback(
    (mockEnv: string) => (mockEnv ? "" : Math.random().toString().slice(2)),
    [],
  );
  return (
    <Actionable
      buttonTitle="Toggle Mock Env"
      inputs={[mockEnv]}
      action={action}
      value={mockEnv}
      setValue={v => setEnv("MOCK", v || "")}
      valueDisplay={v => "MOCK ENV: " + (v || "(unset)")}
    />
  );
}
