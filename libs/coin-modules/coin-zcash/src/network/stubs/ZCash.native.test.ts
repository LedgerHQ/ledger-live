import { firstValueFrom } from "rxjs";
import { ZCash } from "./ZCash.native";

const UNSUPPORTED = "ZCash is not supported on React Native";

describe("ZCash (react-native stub)", () => {
  it("keeps the constructor shape of the real client, defaulting the network", () => {
    expect(new ZCash({ grpcUrl: "https://zaino.example:443" })).toMatchObject({
      grpcUrl: "https://zaino.example:443",
      network: "mainnet",
    });
    expect(new ZCash({ grpcUrl: "https://zaino.example:443", network: "testnet" }).network).toBe(
      "testnet",
    );
  });

  it.each(["estimatedSyncTime", "getChainTip", "findBlockHeight"] as const)(
    "rejects %s rather than answering something half-working",
    async method => {
      await expect(new ZCash({ grpcUrl: "url" })[method](0)).rejects.toThrow(UNSUPPORTED);
    },
  );

  it("errors the sync stream instead of completing empty", async () => {
    const stream = new ZCash({ grpcUrl: "url" }).syncShielded({
      viewingKey: "uview1test",
      startBlockHeight: 0,
    } as Parameters<ZCash["syncShielded"]>[0]);

    await expect(firstValueFrom(stream)).rejects.toThrow(UNSUPPORTED);
  });
});
