import React from "react";
import BigNumber from "bignumber.js";
import { screen, render } from "@tests/test-renderer";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import type { StakingPosition } from "@ledgerhq/live-common/families/tezos/types";
import UnstakingRow from "../UnstakingRow";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({}), { virtual: true });

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

let mockBakerByAddress: Record<string, { name: string } | null> = {};
jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useBaker: (address: string) => mockBakerByAddress[address] ?? null,
  isFinalizablePosition: (uid: string) => uid.includes("final"),
}));

jest.mock("../Row", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({
    onPress,
    statusLabel,
    baker,
    address,
    isLast,
  }: {
    onPress: () => void;
    statusLabel?: string;
    baker?: { name: string } | null;
    address: string;
    isLast?: boolean;
  }) => (
    <TouchableOpacity testID="delegation-row" onPress={onPress}>
      <Text testID="row-status">{statusLabel ?? ""}</Text>
      <Text testID="row-baker">{baker?.name ?? ""}</Text>
      <Text testID="row-address">{address}</Text>
      <Text testID="row-is-last">{String(!!isLast)}</Text>
    </TouchableOpacity>
  );
});

const unit = { code: "XTZ", name: "tez", magnitude: 6 } as Unit;
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const currency = {
  id: "tezos",
  name: "Tezos",
  ticker: "XTZ",
  units: [unit],
} as unknown as Currency;

const makePosition = (overrides: Partial<StakingPosition> = {}): StakingPosition =>
  ({
    uid: "unstaking-1",
    address: "tz1self",
    delegate: "tz1A",
    state: "deactivating",
    amount: new BigNumber(5),
    createdAt: new Date("2026-05-20"),
    actions: [],
    asset: { type: "native" },
    ...overrides,
  }) as unknown as StakingPosition;

describe("UnstakingRow", () => {
  beforeEach(() => {
    mockBakerByAddress = {};
  });

  it("resolves baker from position.delegate", () => {
    mockBakerByAddress = { tz1A: { name: "BakerA" } };
    render(
      <UnstakingRow
        position={makePosition({ delegate: "tz1A" })}
        unit={unit}
        currency={currency}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByTestId("row-baker").props.children).toBe("BakerA");
    expect(screen.getByTestId("row-address").props.children).toBe("tz1A");
  });

  it("falls back to an empty address when delegate is missing", () => {
    render(
      <UnstakingRow
        position={makePosition({ delegate: undefined })}
        unit={unit}
        currency={currency}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByTestId("row-baker").props.children).toBe("");
    expect(screen.getByTestId("row-address").props.children).toBe("");
  });

  it("uses the pending status label for non-finalizable positions", () => {
    render(
      <UnstakingRow
        position={makePosition({ uid: "unstaking-1" })}
        unit={unit}
        currency={currency}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByTestId("row-status").props.children).toBe("tezos.staking.unstaking");
  });

  it("uses the available status label for finalizable positions", () => {
    render(
      <UnstakingRow
        position={makePosition({ uid: "finalizable-1" })}
        unit={unit}
        currency={currency}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByTestId("row-status").props.children).toBe("tezos.staking.available");
  });
});
