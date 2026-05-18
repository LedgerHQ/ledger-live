import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnLCardProps } from "LLD/features/PnL/components/PnLCard/types";
import { buildPnlCards } from "../buildPnlCards";

const fakeT = ((key: string) => key) as unknown as TFunction;

type Input = Parameters<typeof buildPnlCards>[0];

const makeInput = (overrides: Partial<Input> = {}): Input => ({
  unrealisedPnL: new BigNumber(123),
  averageEntryPrice: new BigNumber(456),
  formatFiat: (v: BigNumber) => `formatted(${v.toString()})`,
  onUnrealisedReturnClick: jest.fn(),
  t: fakeT,
  ...overrides,
});

function assertInteractive(
  card: PnLCardProps,
): asserts card is PnLCardProps & { type: "interactive" } {
  if (card.type !== "interactive") throw new Error("expected interactive card");
}

describe("buildPnlCards", () => {
  it("builds an unrealisedReturn card followed by an averageEntryPrice card", () => {
    const cards = buildPnlCards(makeInput());

    expect(cards.map(c => c.id)).toEqual(["unrealisedReturn", "averageEntryPrice"]);
  });

  it("formats each value through the provided fiat formatter", () => {
    const cards = buildPnlCards(
      makeInput({ unrealisedPnL: new BigNumber(10), averageEntryPrice: new BigNumber(20) }),
    );

    expect(cards[0].value).toBe("formatted(10)");
    expect(cards[1].value).toBe("formatted(20)");
  });

  it("wires onUnrealisedReturnClick onto the unrealisedReturn card", () => {
    const onUnrealisedReturnClick = jest.fn();
    const [unrealisedReturnCard] = buildPnlCards(makeInput({ onUnrealisedReturnClick }));

    assertInteractive(unrealisedReturnCard);
    unrealisedReturnCard.onClick();

    expect(onUnrealisedReturnClick).toHaveBeenCalledTimes(1);
  });

  describe("trend on the unrealisedReturn card", () => {
    it("is 'up' for a positive PnL", () => {
      const [card] = buildPnlCards(makeInput({ unrealisedPnL: new BigNumber(10) }));

      assertInteractive(card);
      expect(card.trend).toBe("up");
    });

    it("is 'down' for a negative PnL", () => {
      const [card] = buildPnlCards(makeInput({ unrealisedPnL: new BigNumber(-10) }));

      assertInteractive(card);
      expect(card.trend).toBe("down");
    });

    it("is 'up' for a zero PnL", () => {
      const [card] = buildPnlCards(makeInput({ unrealisedPnL: new BigNumber(0) }));

      assertInteractive(card);
      expect(card.trend).toBe("up");
    });
  });
});
