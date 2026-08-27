import assert from "node:assert/strict";
import test from "node:test";
import { redactErrorMessage, stripStackFrames } from "../src/core/redact.ts";

test("an absent message becomes the empty string", () => {
  assert.equal(redactErrorMessage(undefined), "");
  assert.equal(redactErrorMessage(""), "");
});

test("an ordinary assertion message is left intact", () => {
  const message = "expected 3 to equal 4";
  assert.equal(redactErrorMessage(message), message);
});

/**
 * Deliberately NOT a real BIP39 phrase. The rule matches the *shape* of a
 * mnemonic — a long run of short lowercase words — so a synthetic run exercises
 * it identically, without committing something the repo's secret scanner (or a
 * human skimming the diff) would rightly treat as a leaked seed.
 */
const MNEMONIC_SHAPED = Array.from(
  { length: 12 },
  (_, index) => ["alpha", "bravo", "charlie", "delta"][index % 4],
).join(" ");

test("mnemonic-shaped word runs are redacted", () => {
  assert.equal(redactErrorMessage(MNEMONIC_SHAPED), "[redacted:mnemonic]");
});

test("a mnemonic surrounded by prose is redacted along with the adjacent words", () => {
  // The rule matches any long run of lowercase words, so neighbouring prose is
  // swallowed too. Over-redaction is the deliberate trade: never leak a seed.
  const redacted = redactErrorMessage(`seed was ${MNEMONIC_SHAPED} oops`);

  assert.match(redacted, /\[redacted:mnemonic\]/);
  for (const word of new Set(MNEMONIC_SHAPED.split(" "))) {
    assert.ok(!redacted.includes(word), `expected "${word}" to be redacted`);
  }
});

test("long hex blobs are redacted", () => {
  assert.equal(
    redactErrorMessage("key 0xdeadbeefdeadbeefdeadbeef failed"),
    "key [redacted:hex] failed",
  );
});

test("a short hex value is not mistaken for a secret", () => {
  assert.equal(redactErrorMessage("code 0xdead failed"), "code 0xdead failed");
});

test("bech32 addresses are redacted", () => {
  assert.equal(
    redactErrorMessage("to bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 now"),
    "to [redacted:bech32] now",
  );
});

test("URLs are redacted because they may carry keys", () => {
  assert.equal(
    redactErrorMessage("GET https://rpc.example/v1?apiKey=secret failed"),
    "GET [redacted:url] failed",
  );
});

test("several secrets in one message are all redacted", () => {
  const redacted = redactErrorMessage("0xdeadbeefdeadbeefdeadbeef at https://rpc.example/x");
  assert.equal(redacted, "[redacted:hex] at [redacted:url]");
});

test("stack frames are removed but the failure text is kept", () => {
  const message = [
    "expect(received).toBe(expected)",
    "",
    "Expected: 2",
    "Received: 1",
    "    at Object.<anonymous> (/Users/someone/repo/a.test.ts:4:19)",
    "    at processTicksAndRejections (node:internal/process/task_queues:104:5)",
  ].join("\n");

  assert.equal(
    stripStackFrames(message),
    "expect(received).toBe(expected)\n\nExpected: 2\nReceived: 1",
  );
});

test("a message with no stack is returned unchanged", () => {
  assert.equal(stripStackFrames("plain failure"), "plain failure");
});

test("an empty or absent message becomes the empty string", () => {
  assert.equal(stripStackFrames(undefined), "");
  assert.equal(stripStackFrames(""), "");
});

test("a message that is nothing but frames collapses to empty", () => {
  assert.equal(stripStackFrames("    at foo (/x.ts:1:1)\n    at bar (/y.ts:2:2)"), "");
});

test("the word 'at' inside prose is not mistaken for a frame", () => {
  assert.equal(
    stripStackFrames("failed at the second step"),
    "failed at the second step",
    "only a line that STARTS with 'at ' begins the stack",
  );
});
