import type React from "react";
import { of } from "rxjs";
import { createIntent, type IntentPlatformDefinition } from "./core";

type TestJobState = { step: "running" } | { step: "done"; result: string };
type TestInput = { value: number };
type TestExtraProps = { title: string };

const DummyComponent: React.FC<{
  jobState: TestJobState;
  extraProps: TestExtraProps;
}> = () => null;

const definition: IntentPlatformDefinition<TestJobState, TestInput, TestExtraProps> = {
  label: "test-intent",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: () => of({ step: "done" as const, result: "ok" }),
  component: DummyComponent,
};

describe("createIntent", () => {
  it("spreads the platform definition and attaches the input", () => {
    const input: TestInput = { value: 42 };
    const intent = createIntent(definition, input);

    expect(intent.label).toBe("test-intent");
    expect(intent.requiresConnectedDevice).toBe(true);
    expect(intent.delegateDeviceLockStateHandlingToExecutor).toBe(false);
    expect(intent.job).toBe(definition.job);
    expect(intent.component).toBe(DummyComponent);
    expect(intent.input).toBe(input);
  });

  it("generates a valid uuid v4", () => {
    const intent = createIntent(definition, { value: 1 });
    expect(intent.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("generates a unique uuid on each call", () => {
    const a = createIntent(definition, { value: 1 });
    const b = createIntent(definition, { value: 1 });
    expect(a.uuid).not.toBe(b.uuid);
  });
});
