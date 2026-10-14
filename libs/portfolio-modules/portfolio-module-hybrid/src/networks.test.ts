import { cacheOnSuccess, cachedSideNetworks } from "./networks";

describe("cacheOnSuccess", () => {
  it("loads once for every caller", async () => {
    const load = jest.fn().mockResolvedValue("value");
    const get = cacheOnSuccess(load);

    await expect(Promise.all([get(), get()])).resolves.toEqual(["value", "value"]);
    await expect(get()).resolves.toBe("value");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("loads again after a failure", async () => {
    const load = jest.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValue("value");
    const get = cacheOnSuccess(load);

    await expect(get()).rejects.toThrow("down");
    await expect(get()).resolves.toBe("value");
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("cachedSideNetworks", () => {
  it("lists the networks of each side once", async () => {
    const local = { listNetworks: jest.fn().mockResolvedValue(["bitcoin"]) };
    const remote = { listNetworks: jest.fn().mockResolvedValue(["ethereum"]) };
    const networks = cachedSideNetworks({ local, remote });

    await networks();
    await expect(networks()).resolves.toEqual({ local: ["bitcoin"], remote: ["ethereum"] });
    expect(local.listNetworks).toHaveBeenCalledTimes(1);
    expect(remote.listNetworks).toHaveBeenCalledTimes(1);
  });

  it("retries only the side whose listing failed", async () => {
    const local = { listNetworks: jest.fn().mockResolvedValue(["bitcoin"]) };
    const remote = {
      listNetworks: jest
        .fn()
        .mockRejectedValueOnce(new Error("down"))
        .mockResolvedValue(["ethereum"]),
    };
    const networks = cachedSideNetworks({ local, remote });

    await expect(networks()).rejects.toThrow("down");
    await expect(networks()).resolves.toEqual({ local: ["bitcoin"], remote: ["ethereum"] });
    expect(local.listNetworks).toHaveBeenCalledTimes(1);
    expect(remote.listNetworks).toHaveBeenCalledTimes(2);
  });
});
