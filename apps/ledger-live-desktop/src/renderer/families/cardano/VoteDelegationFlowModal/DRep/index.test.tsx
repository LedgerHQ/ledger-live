import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import DRepField from ".";
import { DRep } from "@ledgerhq/live-common/families/cardano/DRep";
import { CardanoAccount, TransactionStatus } from "@ledgerhq/live-common/families/cardano/types";

jest.mock("@ledgerhq/live-common/families/cardano/react", () => ({
  useCardanoFamilyDReps: jest.fn(),
}));

import { useCardanoFamilyDReps } from "@ledgerhq/live-common/families/cardano/react";

jest.mock("./components/DRepSearchInput", () => ({
  __esModule: true,
  default: ({ onSearch }: { onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input data-testid="search-input" onChange={onSearch} />
  ),
  NoResultPlaceholder: () => <div data-testid="no-result" />,
}));

jest.mock("../ScrollLoadingList", () => ({
  __esModule: true,
  default: ({
    data,
    renderItem,
    noResultPlaceholder,
  }: {
    data: unknown[];
    renderItem: (item: unknown, i: number) => React.ReactNode;
    noResultPlaceholder: React.ReactNode;
  }) => (
    <div data-testid="scroll-list">
      {noResultPlaceholder}
      {data.map((item: unknown, i: number) => renderItem(item, i))}
    </div>
  ),
}));

jest.mock("./components/DRepRow", () => ({
  __esModule: true,
  default: ({
    dRep,
    onClick,
  }: {
    dRep: { hex: string };
    onClick: (drep: { hex: string }) => void;
  }) => (
    <div data-testid="dRep-row" onClick={() => onClick(dRep)}>
      {dRep.hex}
    </div>
  ),
}));

jest.mock("./components/DRepListHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="dRep-list-header" />,
}));

describe("DRepField", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockAccount = { currency: { id: "cardano" } } as CardanoAccount;
  const mockOnChangeDRep = jest.fn();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockStatus = { errors: {}, warnings: {} } as TransactionStatus;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state when searching", () => {
    jest.mocked(useCardanoFamilyDReps).mockReturnValue({
      dReps: [],
      searchQuery: "",
      setSearchQuery: jest.fn(),
      onScrollEndReached: jest.fn(),
      isSearching: true,
      isPaginating: false,
    });

    render(
      <DRepField
        account={mockAccount}
        status={mockStatus}
        onChangeDRep={mockOnChangeDRep}
        selectedDRepHex=""
      />,
    );

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.queryByTestId("dRep-list-header")).not.toBeInTheDocument();
  });

  it("renders DRep list when DReps are available", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockDReps = [{ hex: "dRep1" }, { hex: "dRep2" }] as unknown as DRep[];
    jest.mocked(useCardanoFamilyDReps).mockReturnValue({
      dReps: mockDReps,
      searchQuery: "",
      setSearchQuery: jest.fn(),
      onScrollEndReached: jest.fn(),
      isSearching: false,
      isPaginating: false,
    });

    render(
      <DRepField
        account={mockAccount}
        status={mockStatus}
        onChangeDRep={mockOnChangeDRep}
        selectedDRepHex=""
      />,
    );

    expect(screen.getByTestId("dRep-list-header")).toBeInTheDocument();
    expect(screen.getByText("dRep1")).toBeInTheDocument();
    expect(screen.getByText("dRep2")).toBeInTheDocument();
  });

  it("calls setSearchQuery on search input change", async () => {
    const setSearchQueryMock = jest.fn();
    jest.mocked(useCardanoFamilyDReps).mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dReps: [{ hex: "dRep1" }] as DRep[],
      searchQuery: "",
      setSearchQuery: setSearchQueryMock,
      onScrollEndReached: jest.fn(),
      isSearching: false,
      isPaginating: false,
    });

    render(
      <DRepField
        account={mockAccount}
        status={mockStatus}
        onChangeDRep={mockOnChangeDRep}
        selectedDRepHex=""
      />,
    );

    fireEvent.change(screen.getByTestId("search-input"), { target: { value: "test" } });
    expect(setSearchQueryMock).toHaveBeenCalledWith("test");
  });

  it("calls onChangeDRep when a DRep row is clicked", () => {
    const mockDRep = { hex: "dRep1" };
    jest.mocked(useCardanoFamilyDReps).mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dReps: [mockDRep] as DRep[],
      searchQuery: "",
      setSearchQuery: jest.fn(),
      onScrollEndReached: jest.fn(),
      isSearching: false,
      isPaginating: false,
    });

    render(
      <DRepField
        account={mockAccount}
        status={mockStatus}
        onChangeDRep={mockOnChangeDRep}
        selectedDRepHex=""
      />,
    );

    fireEvent.click(screen.getByText("dRep1"));
    expect(mockOnChangeDRep).toHaveBeenCalledWith(mockDRep);
  });

  it("puts the selected DRep at the first position", () => {
    const mockDReps = [{ hex: "dRep1" }, { hex: "dRep2" }];
    jest.mocked(useCardanoFamilyDReps).mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dReps: mockDReps as DRep[],
      searchQuery: "",
      setSearchQuery: jest.fn(),
      onScrollEndReached: jest.fn(),
      isSearching: false,
      isPaginating: false,
    });

    render(
      <DRepField
        account={mockAccount}
        status={mockStatus}
        onChangeDRep={mockOnChangeDRep}
        selectedDRepHex="drep2"
      />,
    );

    const rows = screen.getAllByTestId("dRep-row");
    expect(rows[0]).toHaveTextContent("dRep2");
    expect(rows[1]).toHaveTextContent("dRep1");
  });
});
