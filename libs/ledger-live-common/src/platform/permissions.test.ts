import { PlatformAPIPermissionDenied } from "../errors";
import { PLATFORM_API_PERMISSIONED_METHODS, withPlatformAPIPermissions } from "./permissions";

describe("withPlatformAPIPermissions", () => {
  const makeHandlers = () => ({
    "account.list": jest.fn((_params: unknown) => ["account"]),
    "account.request": jest.fn((_params: unknown) => "requested"),
    "account.receive": jest.fn((_params: unknown) => "address"),
    "currency.list": jest.fn((_params: unknown) => ["bitcoin"]),
    "transaction.sign": jest.fn((_params: unknown) => "signed"),
  });

  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.mocked(console.warn).mockRestore();
  });

  it("gates the methods that hand out wallet accounts or addresses", () => {
    expect([...PLATFORM_API_PERMISSIONED_METHODS]).toEqual([
      "account.list",
      "account.request",
      "account.receive",
    ]);
  });

  it("lets permitted methods through untouched", () => {
    const handlers = makeHandlers();
    const checked = withPlatformAPIPermissions(
      handlers,
      { id: "app", permissions: ["account.list"] },
      true,
    );

    expect(checked["account.list"]).toBe(handlers["account.list"]);
    expect(checked["account.list"]({})).toEqual(["account"]);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("leaves methods that do not read the wallet alone", () => {
    const handlers = makeHandlers();
    const checked = withPlatformAPIPermissions(handlers, { id: "app", permissions: [] }, true);

    expect(checked["currency.list"]({})).toEqual(["bitcoin"]);
    expect(checked["transaction.sign"]({})).toBe("signed");
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("only logs a missing permission while enforcement is off", () => {
    const handlers = makeHandlers();
    const checked = withPlatformAPIPermissions(handlers, { id: "app", permissions: [] }, false);

    expect(checked["account.list"]({ currencies: [] })).toEqual(["account"]);
    expect(handlers["account.list"]).toHaveBeenCalledWith({ currencies: [] });
    expect(console.warn).toHaveBeenCalledWith(expect.any(String), {
      manifestId: "app",
      method: "account.list",
      enforced: false,
    });
  });

  it("denies a missing permission once enforcement is on", () => {
    const handlers = makeHandlers();
    const checked = withPlatformAPIPermissions(
      handlers,
      { id: "app", permissions: ["account.list"] },
      true,
    );

    expect(() => checked["account.receive"]({})).toThrow(PlatformAPIPermissionDenied);
    expect(handlers["account.receive"]).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(expect.any(String), {
      manifestId: "app",
      method: "account.receive",
      enforced: true,
    });
  });

  it("does not treat a wildcard as a permission", () => {
    const checked = withPlatformAPIPermissions(
      makeHandlers(),
      { id: "app", permissions: ["*"] },
      true,
    );

    expect(() => checked["account.list"]({})).toThrow(PlatformAPIPermissionDenied);
  });

  it("logs each denied method once", () => {
    const checked = withPlatformAPIPermissions(
      makeHandlers(),
      { id: "app", permissions: [] },
      false,
    );

    checked["account.list"]({});
    checked["account.list"]({});
    checked["account.request"]({});

    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it("treats missing manifest permissions as none", () => {
    const checked = withPlatformAPIPermissions(
      makeHandlers(),
      { id: "app", permissions: undefined as unknown as string[] },
      true,
    );

    expect(() => checked["account.list"]({})).toThrow(PlatformAPIPermissionDenied);
  });
});
