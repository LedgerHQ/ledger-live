import { renderHook } from "tests/testSetup";
import { usePTXCustomHandlers } from "../CustomHandlers";

const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const navigateWith = (action: string) => {
  const handler = setup()["custom.navigate"] as unknown as (req: unknown) => Promise<unknown>;
  return handler({ params: { action } });
};

const setup = () => {
  const manifest = { id: "earn", url: new URL("http://x.test") } as Parameters<
    typeof usePTXCustomHandlers
  >[0];
  return renderHook(() => usePTXCustomHandlers(manifest, [])).result.current;
};

describe("usePTXCustomHandlers custom.navigate", () => {
  beforeEach(() => mockNavigate.mockClear());

  it("open-earn navigates to /earn", async () => {
    await expect(navigateWith("open-earn")).resolves.toEqual({ success: true });
    expect(mockNavigate).toHaveBeenCalledWith("/earn");
  });

  it("go-back still navigates back", async () => {
    await navigateWith("go-back");
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("rejects unknown actions", async () => {
    await expect(navigateWith("nope")).rejects.toThrow("Unknown navigation action");
  });
});
