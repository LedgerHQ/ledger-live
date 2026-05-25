/** Minimal jest-circus shapes used by the quarantine environment (avoids @jest/types). */

export type CircusDescribeBlock = {
  name: string;
  parent?: CircusDescribeBlock;
};

export type CircusTest = {
  name: string;
  mode?: string;
  duration?: number;
  parent?: CircusDescribeBlock;
};

export type CircusState = {
  /** Not populated on all circus events in Jest 30; prefer `JestEnvironment.context.testPath`. */
  testPath?: string;
};

export type CircusTestStartEvent = {
  name: "test_start";
  test: CircusTest;
};

export type CircusAsyncEvent = CircusTestStartEvent | { name: string };
