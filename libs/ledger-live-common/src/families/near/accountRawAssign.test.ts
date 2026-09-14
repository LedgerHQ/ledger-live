import { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import nearAccountRawAssign, { assignFromAccountRaw, assignToAccountRaw } from "./accountRawAssign";
import { coinModuleLoaders } from "../../coin-modules/loaders";

const position = (state: string, delegate: string, amount: string) => ({
  uid: `addr.near:${delegate}:${state}`,
  address: "addr.near",
  delegate,
  state,
  actions: state === "active" ? ["undelegate"] : [],
  asset: { type: "native" },
  amount: new BigNumber(amount),
});

const accountWith = (positions: unknown[]): Account =>
  ({ stakingPositions: positions }) as unknown as Account;

describe("near accountRawAssign", () => {
  describe("assignToAccountRaw", () => {
    it("serializes BigNumber amounts to strings without losing yocto precision", () => {
      const raw = {} as AccountRaw;

      assignToAccountRaw(
        accountWith([position("active", "figment.poolv1.near", "2902170000000000000000000")]),
        raw,
      );

      const [serialized] = (raw as AccountRaw & { stakingPositions: { amount: string }[] })
        .stakingPositions;
      expect(serialized.amount).toBe("2902170000000000000000000");
      expect(typeof serialized.amount).toBe("string");
    });

    it("keeps the JSON-safe fields untouched", () => {
      const raw = {} as AccountRaw;

      assignToAccountRaw(accountWith([position("withdrawable", "v.near", "1")]), raw);

      expect(
        (raw as AccountRaw & { stakingPositions: Record<string, unknown>[] }).stakingPositions[0],
      ).toMatchObject({
        uid: "addr.near:v.near:withdrawable",
        address: "addr.near",
        delegate: "v.near",
        state: "withdrawable",
        asset: { type: "native" },
      });
    });

    it("serializes an empty list rather than dropping the field", () => {
      const raw = {} as AccountRaw;

      assignToAccountRaw(accountWith([]), raw);

      expect((raw as AccountRaw & { stakingPositions?: unknown[] }).stakingPositions).toEqual([]);
    });

    it("leaves the raw account alone when the field is absent", () => {
      const raw = {} as AccountRaw;

      assignToAccountRaw({} as Account, raw);

      expect("stakingPositions" in raw).toBe(false);
    });

    it("carries the optional deposited and rewarded amounts", () => {
      const raw = {} as AccountRaw;
      const withBreakdown = {
        ...position("active", "v.near", "300"),
        amountDeposited: new BigNumber("200"),
        amountRewarded: new BigNumber("100"),
      };

      assignToAccountRaw(accountWith([withBreakdown]), raw);

      expect(
        (raw as AccountRaw & { stakingPositions: Record<string, string>[] }).stakingPositions[0],
      ).toMatchObject({ amountDeposited: "200", amountRewarded: "100" });
    });
  });

  describe("assignFromAccountRaw", () => {
    it("revives amounts as BigNumber", () => {
      const account = {} as Account;
      const raw = {
        stakingPositions: [
          { ...position("active", "v.near", "1"), amount: "2902170000000000000000000" },
        ],
      } as unknown as AccountRaw;

      assignFromAccountRaw(raw, account);

      const [revived] = (account as Account & { stakingPositions: { amount: BigNumber }[] })
        .stakingPositions;
      expect(BigNumber.isBigNumber(revived.amount)).toBe(true);
      expect(revived.amount.toFixed()).toBe("2902170000000000000000000");
    });

    it("keeps an explicitly persisted empty list", () => {
      const account = {} as Account;

      assignFromAccountRaw({ stakingPositions: [] } as unknown as AccountRaw, account);

      expect((account as Account & { stakingPositions: unknown[] }).stakingPositions).toEqual([]);
    });

    it("leaves the field absent when the raw account has none", () => {
      const account = {} as Account;

      assignFromAccountRaw({} as AccountRaw, account);

      expect("stakingPositions" in account).toBe(false);
    });
  });

  describe("round trip", () => {
    it("restores every position unchanged", () => {
      const original = [
        position("active", "figment.poolv1.near", "2902170000000000000000000"),
        position("deactivating", "bisontrails2.poolv1.near", "30151800000000000000000"),
        position("withdrawable", "bisontrails2.poolv1.near", "20000300000000000000"),
      ];
      const raw = {} as AccountRaw;
      const restored = {} as Account;

      assignToAccountRaw(accountWith(original), raw);
      // Force the value through JSON exactly as the persistence layer does.
      assignFromAccountRaw(JSON.parse(JSON.stringify(raw)) as AccountRaw, restored);

      const positions = (restored as Account & { stakingPositions: typeof original })
        .stakingPositions;
      expect(positions).toHaveLength(3);
      positions.forEach((p, i) => {
        expect(p.amount.toFixed()).toBe(original[i].amount.toFixed());
        expect(p.uid).toBe(original[i].uid);
        expect(p.delegate).toBe(original[i].delegate);
        expect(p.state).toBe(original[i].state);
      });
    });
  });

  describe("registration", () => {
    it("registers loadAccountRawAssign on the near coin-module loader", () => {
      expect(coinModuleLoaders.find(l => l.family === "near")?.loadAccountRawAssign).toBeDefined();
    });

    it("exposes both hooks on the default export", () => {
      expect(nearAccountRawAssign.assignToAccountRaw).toBe(assignToAccountRaw);
      expect(nearAccountRawAssign.assignFromAccountRaw).toBe(assignFromAccountRaw);
    });
  });
});
