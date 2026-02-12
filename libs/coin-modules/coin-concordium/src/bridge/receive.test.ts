import { firstValueFrom, toArray } from "rxjs";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { ConcordiumSigner } from "../types";
import { VALID_ADDRESS, PUBLIC_KEY } from "../test/fixtures";
import { buildReceive } from "./receive";
import { createFixtureConcordiumAccount } from "./bridge.fixture";

/**
 * Creates a mock SignerContext that is a jest.fn() for call tracking.
 * Unlike createFixtureSignerContext (which invokes the signer), this mock
 * is used to verify that receive() does NOT call the signer context.
 */
const createMockSignerContext = (): SignerContext<ConcordiumSigner> =>
  jest.fn() as unknown as SignerContext<ConcordiumSigner>;

describe("receive", () => {
  describe("buildReceive", () => {
    it("should return address info from account", async () => {
      // GIVEN
      const signerContext = createMockSignerContext();
      const receive = buildReceive(signerContext);
      const account = createFixtureConcordiumAccount();

      // WHEN
      const observable = receive(account);
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        address: VALID_ADDRESS,
        path: "m/1105'/0'/0'/0'/0'/0'",
        publicKey: PUBLIC_KEY,
      });
    });

    it("should use account freshAddress", async () => {
      // GIVEN
      const signerContext = createMockSignerContext();
      const receive = buildReceive(signerContext);
      const customAddress = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";
      const account = createFixtureConcordiumAccount({ freshAddress: customAddress });

      // WHEN
      const observable = receive(account);
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(events[0].address).toBe(customAddress);
    });

    it("should use account freshAddressPath", async () => {
      // GIVEN
      const signerContext = createMockSignerContext();
      const receive = buildReceive(signerContext);
      const customPath = "m/1105'/0'/1'/2'/3'/4'";
      const account = createFixtureConcordiumAccount({ freshAddressPath: customPath });

      // WHEN
      const observable = receive(account);
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(events[0].path).toBe(customPath);
    });

    it("should return empty string for publicKey when concordiumResources is missing", async () => {
      // GIVEN
      const signerContext = createMockSignerContext();
      const receive = buildReceive(signerContext);
      const account = createFixtureConcordiumAccount({ concordiumResources: undefined });

      // WHEN
      const observable = receive(account);
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(events[0].publicKey).toBe("");
    });

    it("should return empty string for publicKey when publicKey is missing in resources", async () => {
      // GIVEN
      const signerContext = createMockSignerContext();
      const receive = buildReceive(signerContext);
      const account = createFixtureConcordiumAccount({
        concordiumResources: {
          isOnboarded: true,
          publicKey: undefined,
        } as any,
      });

      // WHEN
      const observable = receive(account);
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(events[0].publicKey).toBe("");
    });

    it("should complete the observable after emitting", async () => {
      // GIVEN
      const signerContext = createMockSignerContext();
      const receive = buildReceive(signerContext);
      const account = createFixtureConcordiumAccount();

      // WHEN
      const observable = receive(account);
      let completed = false;
      await new Promise<void>((resolve, reject) => {
        observable.subscribe({
          complete: () => {
            completed = true;
            resolve();
          },
          error: reject,
        });
      });

      // THEN
      expect(completed).toBe(true);
    });

    it("should not call signerContext (no device interaction needed)", async () => {
      // GIVEN
      const signerContext = createMockSignerContext();
      const receive = buildReceive(signerContext);
      const account = createFixtureConcordiumAccount();

      // WHEN
      const observable = receive(account);
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(signerContext).not.toHaveBeenCalled();
    });

    it("should propagate errors through observable", async () => {
      // GIVEN
      const signerContext = createMockSignerContext();
      const receive = buildReceive(signerContext);
      const errorMessage = "Property access failed";
      const account = {
        get freshAddress(): string {
          throw new Error(errorMessage);
        },
        freshAddressPath: "m/1105'/0'/0'/0'/0'/0'",
        concordiumResources: { publicKey: "abc" },
      } as any;

      // WHEN
      const observable = receive(account);

      // THEN
      await expect(firstValueFrom(observable)).rejects.toThrow(errorMessage);
    });
  });
});
