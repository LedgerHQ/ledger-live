import React, { useCallback } from "react";
import { setEnv } from "@ledgerhq/live-env";
import { v4 as uuid } from "uuid";
import { Actionable } from "./Actionable";
import useEnv from "../useEnv";

export function AppMockEnv() {
  const mockEnv = useEnv("MOCK");
  const action = useCallback((mockEnv: string) => (mockEnv ? "" : uuid()), []);
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
