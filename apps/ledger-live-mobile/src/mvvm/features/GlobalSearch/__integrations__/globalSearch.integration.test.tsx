import React from "react";
import { render, screen } from "@tests/test-renderer";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { GlobalSearch } from "../screens/GlobalSearch";
import { GLOBAL_SEARCH_TEST_IDS } from "../screens/GlobalSearch/testIds";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

describe("GlobalSearch screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the search input with the 'Search assets' placeholder", () => {
    render(<GlobalSearch />);

    expect(screen.getByTestId(GLOBAL_SEARCH_TEST_IDS.searchInput)).toBeVisible();
    expect(screen.getByPlaceholderText(/search assets/i)).toBeVisible();
  });

  it("tracks search_open on mount", () => {
    render(<GlobalSearch />);

    expect(track).toHaveBeenCalledWith("search_open", { page: ScreenName.GlobalSearch });
  });

  it("navigates back when the back button is pressed", async () => {
    const { user } = render(<GlobalSearch />);

    await user.press(screen.getByLabelText(/back/i));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("reflects typed input in the search field", async () => {
    const { user } = render(<GlobalSearch />);

    await user.type(screen.getByPlaceholderText(/search assets/i), "bitcoin");

    expect(screen.getByDisplayValue("bitcoin")).toBeVisible();
  });

  it("swaps default sections for search results when typing and restores them on clear", async () => {
    const { user } = render(<GlobalSearch />);
    const input = screen.getByPlaceholderText(/search assets/i);

    expect(screen.getByTestId(GLOBAL_SEARCH_TEST_IDS.defaultSections)).toBeVisible();

    await user.type(input, "b");

    expect(screen.queryByTestId(GLOBAL_SEARCH_TEST_IDS.defaultSections)).toBeNull();
    expect(screen.getAllByTestId(GLOBAL_SEARCH_TEST_IDS.searchSkeleton).length).toBeGreaterThan(0);

    await user.clear(input);

    expect(screen.getByTestId(GLOBAL_SEARCH_TEST_IDS.defaultSections)).toBeVisible();
  });
});
