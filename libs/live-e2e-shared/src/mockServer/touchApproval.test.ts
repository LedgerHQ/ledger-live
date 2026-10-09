import assert from "node:assert/strict";
import test from "node:test";
import { touchApprovalTarget, type ScreenEvent } from "./touchApproval";

const event = (text: string, y: number, x = 10): ScreenEvent => ({ text, x, y });

test("taps the Confirm button under a Confirm title", () => {
  const button = event("Confirm", 320, 180);
  const target = touchApprovalTarget([
    event("Confirm contact details?", 48),
    event("Cancel", 320, 40),
    event("4 of 4", 24, 140),
    button,
  ]);

  assert.equal(target, button);
});

test("taps the lower Confirm when the title is drawn word by word", () => {
  const button = event("Confirm", 320, 180);
  const target = touchApprovalTarget([
    event("Confirm", 48),
    event("contact", 48, 80),
    event("details?", 48, 150),
    event("Cancel", 320, 40),
    event("4", 24),
    event("of", 24, 30),
    event("4", 24, 50),
    button,
  ]);

  assert.equal(target, button);
});

test("taps Accept and send when that is the control", () => {
  const button = event("Accept and send", 400, 120);
  const target = touchApprovalTarget([event("Review transaction", 40), button]);

  assert.equal(target, button);
});

test("pages forward when a split title has no footer button", () => {
  const target = touchApprovalTarget([
    event("Confirm", 48),
    event("contact", 48, 80),
    event("details?", 48, 150),
    event("Cancel", 320, 40),
    event("1 of 4", 24, 140),
  ]);

  assert.equal(target, undefined);
});

test("pages forward when the only approval text is the review title", () => {
  const target = touchApprovalTarget([
    event("Confirm contact details?", 48),
    event("Cancel", 320, 40),
    event("1 of 4", 24, 140),
  ]);

  assert.equal(target, undefined);
});
