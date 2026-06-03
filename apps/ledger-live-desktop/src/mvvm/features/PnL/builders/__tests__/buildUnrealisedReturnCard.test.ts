import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import { trendFromSign } from "@ledgerhq/wallet-pnl";
import type { PnLCardProps } from "../../components/PnLCard/types";
import { buildUnrealisedReturnCard } from "../buildUnrealisedReturnCard";

const fakeT = ((key: string) => key) as unknown as TFunction;

type Input = Parameters<typeof buildUnrealisedReturnCard>[0];

const makeInput = (overrides: Partial<Input> = {}): Input => ({
  namespace: "pnl.asset",
  unrealisedPnL: new BigNumber(123),
  formatFiat: (v: BigNumber) => `formatted(${v.toString()})`,
  onClick: jest.fn(),
  t: fakeT,
  ...overrides,
});

function assertInteractive(
  card: PnLCardProps,
): asserts card is PnLCardProps & { type: "interactive" } {
  if (card.type !== "interactive") throw new Error("expected interactive card");
}

describe("buildUnrealisedReturnCard", () => {
  it("uses the namespace to build the title key", () => {
    expect(buildUnrealisedReturnCard(makeInput({ namespace: "pnl.asset" })).title).toBe(
      "pnl.asset.return.title",
    );
  });

  it("formats the value through the provided fiat formatter", () => {
    const card = buildUnrealisedReturnCard(makeInput({ unrealisedPnL: new BigNumber(10) }));
    expect(card.value).toBe("formatted(10)");
  });

  it("wires the onClick handler", () => {
    const onClick = jest.fn();
    const card = buildUnrealisedReturnCard(makeInput({ onClick }));

    assertInteractive(card);
    card.onClick();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("derives the trend from the unrealised PnL sign", () => {
    const unrealisedPnL = new BigNumber(-7);
    const card = buildUnrealisedReturnCard(makeInput({ unrealisedPnL }));

    assertInteractive(card);
    expect(card.trend).toBe(trendFromSign(unrealisedPnL));
  });
});
