/**
 * @jest-environment jsdom
 */
import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react";
import "../../__tests__/test-helpers/dom-polyfill";
import { useSortedValidators } from "./react";
import type { PolkadotNomination, PolkadotValidator } from "./types";

const buildValidator = (address: string, isBlocked = false): PolkadotValidator => ({
  address,
  identity: address,
  nominatorsCount: 0,
  rewardPoints: null,
  commission: new BigNumber(0),
  totalBonded: new BigNumber(0),
  selfBonded: new BigNumber(0),
  isElected: false,
  isOversubscribed: false,
  isBlocked,
});

const buildNomination = (address: string): PolkadotNomination => ({
  address,
  value: new BigNumber(0),
  status: "active",
});

describe("useSortedValidators", () => {
  const validators = [
    buildValidator("open"),
    buildValidator("blocked", true),
    buildValidator("blockedAndNominated", true),
    buildValidator("nominated"),
  ];
  const nominations = [buildNomination("blockedAndNominated"), buildNomination("nominated")];

  it("hides blocked validators that are not nominated", () => {
    const { result } = renderHook(() => useSortedValidators("", validators, nominations));

    expect(result.current.map(v => v.address)).not.toContain("blocked");
  });

  it("keeps blocked validators that are already nominated, listed first", () => {
    const { result } = renderHook(() => useSortedValidators("", validators, nominations));

    expect(result.current.map(v => v.address)).toEqual([
      "blockedAndNominated",
      "nominated",
      "open",
    ]);
  });

  it("hides blocked validators that are not nominated when searching", () => {
    const { result } = renderHook(() => useSortedValidators("blocked", validators, nominations));

    expect(result.current.map(v => v.address)).toEqual(["blockedAndNominated"]);
  });
});
