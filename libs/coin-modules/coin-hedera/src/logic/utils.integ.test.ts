import { toEVMAddress } from "./utils";

describe("toEVMAddress", () => {
  it("should resolve from an account id to a long-zero EVM address for an account without EVM alias", async () => {
    const address = await toEVMAddress("0.0.12345");
    expect(address).toEqual("0x0000000000000000000000000000000000003039");
  });

  it("should resolve from a long-zero EVM address to a long-zero EVM address for an account without EVM alias", async () => {
    const address = await toEVMAddress("0x0000000000000000000000000000000000003039");
    expect(address).toEqual("0x0000000000000000000000000000000000003039");
  });

  it("should resolve from a long-zero EVM address without prefix to a long-zero EVM address for an account without EVM alias", async () => {
    const address = await toEVMAddress("0000000000000000000000000000000000003039");
    expect(address).toEqual("0x0000000000000000000000000000000000003039");
  });

  it("should resolve from an account id to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress("0.0.9806001");
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });

  it("should resolve from an EVM alias address to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });

  it("should resolve from an EVM alias address without prefix to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress("cf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });

  it("should resolve from a long-zero EVM address to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress("0x000000000000000000000000000000000095a0b1");
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });

  it("should resolve from a long-zero EVM address without prefix to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress("000000000000000000000000000000000095a0b1");
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });
});
