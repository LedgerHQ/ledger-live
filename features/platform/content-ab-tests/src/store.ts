import type { ContentAbTestPayload, ContentAbTests } from "./parse";
import { buildContentAbTestCopyOverrides, type ContentAbTestCopyOverrides } from "./copyOverrides";

type Subscriber = (payloads: ContentAbTests) => void;
type CopyOverridesSubscriber = (copyOverrides: ContentAbTestCopyOverrides) => void;

let remote: ContentAbTests = {};
let overrides: ContentAbTests = {};
let copyOverrides: ContentAbTestCopyOverrides = buildContentAbTestCopyOverrides({});
const subscribers = new Set<Subscriber>();
const copyOverridesSubscribers = new Set<CopyOverridesSubscriber>();

export function getContentAbTests(): ContentAbTests {
  return { ...remote, ...overrides };
}

export function getContentAbTestCopyOverrides(): ContentAbTestCopyOverrides {
  return copyOverrides;
}

export function setContentAbTests(next: ContentAbTests): ContentAbTests {
  remote = next;
  return publish();
}

export function setContentAbTestOverride(
  id: string,
  value: ContentAbTestPayload | undefined,
): ContentAbTests {
  if (value === undefined) {
    const next = { ...overrides };
    delete next[id];
    overrides = next;
  } else {
    overrides = { ...overrides, [id]: value };
  }
  return publish();
}

export function clearContentAbTestOverrides(): ContentAbTests {
  overrides = {};
  return publish();
}

export function isContentAbTestOverridden(id: string): boolean {
  return Object.hasOwn(overrides, id);
}

export function hasContentAbTestOverrides(): boolean {
  return Object.keys(overrides).length > 0;
}

export function subscribeToContentAbTests(callback: Subscriber): () => void {
  subscribers.add(callback);
  callback(getContentAbTests());
  return () => {
    subscribers.delete(callback);
  };
}

export function subscribeToContentAbTestCopyOverrides(
  callback: CopyOverridesSubscriber,
): () => void {
  copyOverridesSubscribers.add(callback);
  return () => {
    copyOverridesSubscribers.delete(callback);
  };
}

function publish(): ContentAbTests {
  const payloads = getContentAbTests();
  copyOverrides = buildContentAbTestCopyOverrides(payloads);
  subscribers.forEach(callback => callback(payloads));
  copyOverridesSubscribers.forEach(callback => callback(copyOverrides));
  return payloads;
}
