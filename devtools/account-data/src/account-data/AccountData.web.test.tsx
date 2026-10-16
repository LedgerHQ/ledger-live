import { act, render, screen } from "@testing-library/react";
import AccountData from "./AccountData";

const noop = () => undefined;

describe("AccountData", () => {
  beforeEach(() => jest.useFakeTimers({ now: 10_000 }));
  afterEach(() => jest.useRealTimers());

  it("keeps the age of a read moving while the tool is idle", () => {
    render(
      <AccountData
        accounts={[
          {
            accountUUID: "uuid",
            network: "ethereum:main",
            key: "0xabc",
            path: "m/44h/60h/0h/0/0",
            balanceStatus: { pending: false, sourceId: "full-sync", readAt: 10_000 },
          },
        ]}
        onReadBalance={noop}
        onReadOperations={noop}
        onLoadMoreOperations={noop}
        onReadAll={noop}
      />,
    );
    expect(screen.getByText(/served by full-sync · 0s ago/)).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(5_000));
    expect(screen.getByText(/served by full-sync · 5s ago/)).toBeInTheDocument();
  });
});
