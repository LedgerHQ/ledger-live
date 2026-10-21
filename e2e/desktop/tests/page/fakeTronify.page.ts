import { expect } from "@playwright/test";
import {
  RENT_ORDER_PATH,
  RENT_PAYMENT_UPLOAD_PATH,
  hasUsdtTransferBroadcast,
  type FakeTronify,
} from "@ledgerhq/live-e2e-shared/tronify/index";
import { step } from "tests/misc/reporters/step";

const FAKE_TIMEOUT_MS = 30_000;

/** The local fake standing in for Tronify and TronGrid: what the app sent it. */
export class FakeTronifyPage {
  constructor(readonly fake: FakeTronify) {}

  private requestCount(path: string) {
    return this.fake.log().filter(request => request.path.startsWith(path)).length;
  }

  private reachedTronGrid() {
    return this.fake.log().some(({ path }) => path.startsWith("/trongrid/"));
  }

  /**
   * SAFETY: call before signing a TX-A. The specs use real Tronify payees, so only the coin-config
   * override keeps the app off the real Tronify and, once TX-C is broadcast, off the real TronGrid.
   * Returns the payee the device must show: the one the app's single order got.
   */
  @step("Expect the app to order one rent from the fake Tronify")
  async expectRentOrdered(): Promise<string> {
    await expect
      .poll(
        () => ({ orders: this.requestCount(RENT_ORDER_PATH), tronGrid: this.reachedTronGrid() }),
        { timeout: FAKE_TIMEOUT_MS },
      )
      .toEqual({ orders: 1, tronGrid: true });
    const order = this.fake.orders().at(-1);
    if (!order) throw new Error("The fake Tronify logged a rent order but kept none");
    return order.payee;
  }

  @step("Expect the app to have placed and paid one rent order")
  async expectRentPaidOnce() {
    await expect
      .poll(
        () => ({
          orders: this.requestCount(RENT_ORDER_PATH),
          uploads: this.requestCount(RENT_PAYMENT_UPLOAD_PATH),
        }),
        { timeout: FAKE_TIMEOUT_MS },
      )
      .toEqual({ orders: 1, uploads: 1 });
  }

  @step("Expect a $1 USDT transfer to $0 broadcast to the fake TronGrid")
  async expectUsdtTransferBroadcast(recipient: string | undefined, amount: string) {
    await expect
      .poll(() => hasUsdtTransferBroadcast(this.fake, recipient, amount), {
        timeout: FAKE_TIMEOUT_MS,
      })
      .toBe(true);
  }

  /** Delivers the energy of every paid rent, as a rent landing late. */
  landPaidRents() {
    this.fake.landPaidRents();
  }
}
