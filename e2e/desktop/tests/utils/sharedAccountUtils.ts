import { test } from "tests/fixtures/common";

/**
 * Keep a flow whose accounts are shared between the device legs on the primary one.
 *
 * The dual-device dispatch ("nanoSP and stax") runs the whole suite twice concurrently, so both
 * legs would build transactions from the same account and collide on its nonce. Only transactions
 * that reach the chain collide, so the second leg is given up when broadcasting is on and keeps its
 * coverage otherwise. The scheduled runs pick a single device, hence never reach this.
 */
export function skipSharedAccountOnSecondaryLeg(flowName: string): void {
  test.skip(
    process.env.DISABLE_TRANSACTION_BROADCAST === "0" && process.env.E2E_PRIMARY_DEVICE === "false",
    `${flowName} broadcasts from accounts the parallel device leg shares, so it runs on the primary leg only`,
  );
}
