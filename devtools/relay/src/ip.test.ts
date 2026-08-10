import { networkInterfaces } from "os";
import { getLanIp } from "./ip";

jest.mock("os");

const mockNetworkInterfaces = jest.mocked(networkInterfaces);

function makeIface(address: string, internal = false) {
  return [{ family: "IPv4", address, internal, netmask: "255.255.255.0", mac: "", cidr: null }];
}

describe("getLanIp", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the address of a preferred interface (en0)", () => {
    mockNetworkInterfaces.mockReturnValue({ en0: makeIface("192.168.1.10") } as any);
    expect(getLanIp()).toBe("192.168.1.10");
  });

  it("prefers en0 over en1 when both are present", () => {
    mockNetworkInterfaces.mockReturnValue({
      en0: makeIface("192.168.1.10"),
      en1: makeIface("10.0.0.5"),
    } as any);
    expect(getLanIp()).toBe("192.168.1.10");
  });

  it("falls back to a non-preferred interface when no preferred one is present", () => {
    mockNetworkInterfaces.mockReturnValue({ wlan0: makeIface("10.0.0.5") } as any);
    expect(getLanIp()).toBe("10.0.0.5");
  });

  it("skips VPN interfaces (utun)", () => {
    mockNetworkInterfaces.mockReturnValue({ utun0: makeIface("10.8.0.1") } as any);
    expect(getLanIp()).toBeNull();
  });

  it("skips internal (loopback) interfaces", () => {
    mockNetworkInterfaces.mockReturnValue({ lo: makeIface("127.0.0.1", true) } as any);
    expect(getLanIp()).toBeNull();
  });

  it("returns null when no interfaces are available", () => {
    mockNetworkInterfaces.mockReturnValue({} as any);
    expect(getLanIp()).toBeNull();
  });
});
