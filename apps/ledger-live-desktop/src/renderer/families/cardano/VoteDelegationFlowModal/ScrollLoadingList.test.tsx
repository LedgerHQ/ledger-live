import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import ScrollLoadingList from "./ScrollLoadingList";
import { DRep } from "@ledgerhq/live-common/families/cardano/DRep";

describe("ScrollLoadingList", () => {
  const mockRenderItem = (item: DRep) => (
    <div key={item.hex} data-testid={`item-${item.hex}`}>
      {item.hex}
    </div>
  );
  const mockFetchNextPage = jest.fn();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockData = Array.from({ length: 30 }, (_, i) => ({
    hex: `drep${i + 1}`,
  })) as DRep[];

  const defaultProps = {
    data: mockData,
    renderItem: mockRenderItem,
    noResultPlaceholder: <div data-testid="no-result">No Result</div>,
    fetchPoolsFromNextPage: mockFetchNextPage,
    search: "",
    isPaginating: false,
    bufferSize: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders data correctly within buffer size", () => {
    render(<ScrollLoadingList {...defaultProps} />);
    // data.length (30) > bufferSize (20)
    // useEffect sets offset to data.length - 20 = 10
    expect(screen.getAllByTestId(/item-drep/)).toHaveLength(10);
  });

  it("renders all data if length is less than buffer size", () => {
    render(<ScrollLoadingList {...defaultProps} data={mockData.slice(0, 5)} bufferSize={10} />);
    expect(screen.getAllByTestId(/item-drep/)).toHaveLength(5);
  });

  it("renders noResultPlaceholder when data is empty", () => {
    render(<ScrollLoadingList {...defaultProps} data={[]} />);
    expect(screen.getByTestId("no-result")).toBeInTheDocument();
  });

  it("renders spinner when isPaginating is true", () => {
    render(<ScrollLoadingList {...defaultProps} isPaginating={true} />);
    expect(screen.getByTestId("big-loading-spinner")).toBeInTheDocument();
  });

  it("resets scroll offset when search changes", () => {
    const { rerender } = render(<ScrollLoadingList {...defaultProps} />);
    expect(screen.getAllByTestId(/item-drep/)).toHaveLength(10);

    // Trigger effect by changing data and search
    rerender(<ScrollLoadingList {...defaultProps} data={[...mockData]} search="test" />);
    expect(screen.getAllByTestId(/item-drep/)).toHaveLength(20);
  });

  it("calls fetchPoolsFromNextPage on scroll end", async () => {
    jest.useFakeTimers();
    render(<ScrollLoadingList {...defaultProps} />);
    const container = screen.getAllByTestId(/item-drep/)[0].parentElement!;

    // Mock scroll properties
    Object.defineProperty(container, "scrollTop", {
      value: 100,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(container, "offsetHeight", {
      value: 100,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(container, "scrollHeight", {
      value: 200,
      configurable: true,
      writable: true,
    });

    fireEvent.scroll(container);

    jest.advanceTimersByTime(100);
    expect(mockFetchNextPage).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
