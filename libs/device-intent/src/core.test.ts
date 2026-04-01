import type React from "react";
import { of } from "rxjs";
import { createIntent, type IntentPlatformDefinition } from "./core";

type TestJobState = { step: "running" } | { step: "done"; result: string };
type TestInput = { value: number };
type TestExtraProps = { title: string };

const DummyComponent: React.FC<{
  jobState: TestJobState | undefined;
  extraProps: TestExtraProps;
}> = () => null;

const myIntentDefinitionWithInput: IntentPlatformDefinition<
  TestJobState,
  TestInput,
  TestExtraProps
> = {
  label: "test-intent",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: () => of({ step: "done" as const, result: "ok" }),
  component: DummyComponent,
};

const myIntentDefinitionWithUndefinedInput: IntentPlatformDefinition<
  TestJobState,
  undefined,
  TestExtraProps
> = {
  label: "test-intent",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: () => of({ step: "done" as const, result: "ok" }),
  component: DummyComponent,
};

describe("createIntent", () => {
  it("spreads the platform definition and attaches the input", () => {
    const input: TestInput = { value: 42 };
    const intent = createIntent(myIntentDefinitionWithInput, input);

    expect(intent.label).toBe("test-intent");
    expect(intent.requiresConnectedDevice).toBe(true);
    expect(intent.delegateDeviceLockStateHandlingToExecutor).toBe(false);
    expect(intent.job).toBe(myIntentDefinitionWithInput.job);
    expect(intent.component).toBe(DummyComponent);
    expect(intent.input).toBe(input);
  });

  it("works with undefined input", () => {
    const intent = createIntent(myIntentDefinitionWithUndefinedInput);
    expect(intent.label).toBe("test-intent");
    expect(intent.requiresConnectedDevice).toBe(true);
    expect(intent.delegateDeviceLockStateHandlingToExecutor).toBe(false);
    expect(intent.job).toBe(myIntentDefinitionWithUndefinedInput.job);
    expect(intent.component).toBe(DummyComponent);
    expect(intent.input).toBe(undefined);
  });

  it("generates a valid uuid v4", () => {
    const intent = createIntent(myIntentDefinitionWithInput, { value: 1 });
    expect(intent.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("generates a unique uuid on each call", () => {
    const a = createIntent(myIntentDefinitionWithInput, { value: 1 });
    const b = createIntent(myIntentDefinitionWithInput, { value: 1 });
    expect(a.uuid).not.toBe(b.uuid);
  });

  it("attaches listeners when provided (with input)", () => {
    const onJobStateChanged = jest.fn();
    const onJobComplete = jest.fn();
    const onJobError = jest.fn();

    const intent = createIntent(myIntentDefinitionWithInput, { value: 1 }, {
      onJobStateChanged,
      onJobComplete,
      onJobError,
    });

    expect(intent.onJobStateChanged).toBe(onJobStateChanged);
    expect(intent.onJobComplete).toBe(onJobComplete);
    expect(intent.onJobError).toBe(onJobError);
  });

  it("attaches listeners when provided (with undefined input)", () => {
    const onJobComplete = jest.fn();

    const intent = createIntent(myIntentDefinitionWithUndefinedInput, undefined, {
      onJobComplete,
    });

    expect(intent.onJobComplete).toBe(onJobComplete);
  });

  it("has no listener fields when none are provided", () => {
    const intent = createIntent(myIntentDefinitionWithInput, { value: 1 });

    expect(intent.onJobStateChanged).toBeUndefined();
    expect(intent.onJobComplete).toBeUndefined();
    expect(intent.onJobError).toBeUndefined();
  });

  it("supports partial listeners", () => {
    const onJobError = jest.fn();
    const intent = createIntent(myIntentDefinitionWithInput, { value: 1 }, {
      onJobError,
    });

    expect(intent.onJobStateChanged).toBeUndefined();
    expect(intent.onJobComplete).toBeUndefined();
    expect(intent.onJobError).toBe(onJobError);
  });
});
