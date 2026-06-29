import { renderHook } from "@testing-library/react";
import { useFindTokenByIdQuery } from "@domain/api-currency-token";
import { useTokenById } from "./useTokenById";

jest.mock("@domain/api-currency-token", () => ({
  useFindTokenByIdQuery: jest.fn(() => ({ data: undefined, isLoading: false })),
}));

const mockQuery = useFindTokenByIdQuery as unknown as jest.Mock;

describe("useTokenById", () => {
  beforeEach(() => mockQuery.mockClear());

  it("queries the id and passes the result through", () => {
    mockQuery.mockReturnValue({ data: { id: "ethereum/erc20/usdc" }, isLoading: false });
    const { result } = renderHook(() => useTokenById("ethereum/erc20/usdc"));
    expect(mockQuery).toHaveBeenCalledWith({ id: "ethereum/erc20/usdc" }, { skip: false });
    expect(result.current.data).toEqual({ id: "ethereum/erc20/usdc" });
  });

  it("skips the request when no id is given", () => {
    renderHook(() => useTokenById(undefined));
    expect(mockQuery).toHaveBeenCalledWith({ id: "" }, { skip: true });
  });
});
