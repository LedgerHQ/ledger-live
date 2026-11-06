import { selectEligibleAnalyticsPositions } from "./selectEligibleAnalyticsPositions";
import {
  createMockAccount,
  createMockToken,
  mockAmount,
  pendingOperation,
  type MockOperation,
} from "../analyticsSources.mock";

const eth = createMockAccount("eligible-eth");
const token = createMockToken(eth);
const parent = { ...eth, subAccounts: [token] };
const isConfirmed = (operation: MockOperation) => operation.isConfirmed;

describe("selectEligibleAnalyticsPositions", () => {
  it("should list native ETH without its tokens, then each token as its own position", () => {
    const positions = selectEligibleAnalyticsPositions([parent], [], isConfirmed);
    expect(positions.map(position => position.id)).toEqual([eth.id, token.id]);
    expect(positions[0]).toMatchObject({ id: eth.id, subAccounts: undefined });
  });

  it("should include zero native ETH when confirmed token history makes its account eligible", () => {
    const zero = { ...parent, balance: mockAmount(0), operations: [] };
    expect(
      selectEligibleAnalyticsPositions([zero], [], isConfirmed).map(position => position.id),
    ).toEqual([eth.id, token.id]);
  });

  it("should exclude pending-only zero positions and blacklisted assets", () => {
    const pending = { ...eth, balance: mockAmount(0), operations: [pendingOperation] };
    expect(selectEligibleAnalyticsPositions([pending], [], isConfirmed)).toEqual([]);
    expect(
      selectEligibleAnalyticsPositions([parent], [token.token.id], isConfirmed).map(
        position => position.id,
      ),
    ).toEqual([eth.id]);
  });

  it("should exclude a zero token without confirmed history", () => {
    const emptyToken = { ...token, balance: mockAmount(0), operations: [pendingOperation] };
    expect(
      selectEligibleAnalyticsPositions(
        [{ ...eth, subAccounts: [emptyToken] }],
        [],
        isConfirmed,
      ).map(position => position.id),
    ).toEqual([eth.id]);
  });

  it("should check confirmations against the parent account", () => {
    const check = jest.fn(() => true);
    selectEligibleAnalyticsPositions([{ ...parent, balance: mockAmount(0) }], [], check);
    expect(check).toHaveBeenCalledWith(eth.operations[0], expect.objectContaining({ id: eth.id }));
  });
});
