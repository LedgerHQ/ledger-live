import { spawnFlextesa, killFlextesa } from "./flextesa";

jest.setTimeout(600_000);

it("initializes Tezos chain", async () => {
  await spawnFlextesa();
  await killFlextesa();
});
