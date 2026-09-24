import type { ContentAbTestPayload, ContentAbTests } from "./parse";

type Subscriber = (payloads: ContentAbTests) => void;

let remote: ContentAbTests = {};
let overrides: ContentAbTests = {};
const subscribers = new Set<Subscriber>();

export function getContentAbTests(): ContentAbTests {
  return { ...remote, ...overrides };
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

function publish(): ContentAbTests {
  const payloads = getContentAbTests();
  subscribers.forEach(callback => callback(payloads));
  return payloads;
}
