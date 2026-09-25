import util from 'node:util';

import type { Primitive, Stage, Status, Severity } from '@support/jest-allure2-reporter';

import { isPromiseLike } from './isPromiseLike';

const SEVERITY_VALUES = new Set<Severity>(['blocker', 'critical', 'normal', 'minor', 'trivial']);
const STATUS_VALUES = new Set<Status>(['failed', 'broken', 'passed', 'skipped', 'unknown']);
const STAGE_VALUES = new Set<Stage>(['scheduled', 'running', 'finished', 'pending', 'interrupted']);

export function assertNotNullish(value: unknown, name = 'value'): asserts value {
  if (value == null) {
    throw new TypeError(`Expected a non-nullish ${name}, got instead: ${util.inspect(value)}`);
  }
}

export function assertString(value: unknown, name = 'value'): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`Expected a string ${name}, got instead: ${util.inspect(value)}`);
  }
}

export function assertAttachmentContent(value: unknown, name = 'value'): asserts value is string {
  if (isPromiseLike(value)) {
    return;
  }

  if (typeof value !== 'string' && !Buffer.isBuffer(value) && !ArrayBuffer.isView(value)) {
    throw new TypeError(
      `Expected a string or a buffer "${name}, got instead: ${util.inspect(value)}`,
    );
  }
}

export function assertPrimitive(value: unknown, name = 'value'): asserts value is Primitive {
  if (typeof value === 'string') return;
  if (typeof value === 'number') return;
  if (typeof value === 'boolean') return;
  if (value == null) return;

  throw new TypeError(`Expected a primitive ${name}, got instead: ${util.inspect(value)}`);
}

export function assertFunction(
  function_: unknown,
  name = 'function',
): asserts function_ is Function {
  if (typeof function_ !== 'function') {
    throw new TypeError(`Expected a ${name}, got instead: ${util.inspect(function_)}`);
  }
}

export function assertArray(value: unknown, name = 'value'): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`Expected an array ${name}, got instead: ${util.inspect(value)}`);
  }
}

export function assertSeverity(value: unknown): asserts value is Severity {
  if (!SEVERITY_VALUES.has(value as Severity)) {
    throw new TypeError(`Expected a valid severity level, got instead: ${util.inspect(value)}`);
  }
}

export function assertStatus(value: unknown): asserts value is Status {
  if (!STATUS_VALUES.has(value as Status)) {
    throw new TypeError(`Expected a valid status, got instead: ${util.inspect(value)}`);
  }
}

export function assertStage(value: unknown): asserts value is Stage {
  if (!STAGE_VALUES.has(value as Stage)) {
    throw new TypeError(`Expected a valid stage, got instead: ${util.inspect(value)}`);
  }
}
