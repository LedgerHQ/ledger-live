import coinConfig, { StellarCoinConfig } from "../config";
import { fetchAllOperations } from "./horizon";

describe("fetchAllOperations", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      (): StellarCoinConfig => ({
        status: { type: "active" },
        explorer: {
          url: "https://stellar.coin.ledger.com",
          fetchLimit: 10,
        },
      }),
    );
  });

  it(
    "fetch operations with limitations, set order to desc",
    async () => {
      const addr = "GCOCZ3ODGW3YH6PPGMLGT3MORS5YBTVJCSL46TC2NMU2KCXGL52XLEZB";
      const limit = 30;
      const ops = await fetchAllOperations(addr, addr, "desc", "241343231793946722", limit);
      expect(ops.length).toEqual(limit);
      expect(ops[0].id).toEqual(
        `${addr}-00b0081a2c5c5e62cf5f5813691d33ab71a8b46b115d645bcd9df4e9c7941778-IN`,
      );
      expect(ops[29].id).toEqual(
        `${addr}-00b0081a2c5c5e62cf5f5813691d33ab71a8b46b115d645bcd9df4e9c7941778-IN`,
      );
    },
    10 * 1_000,
  );

  it(
    "fetch operations without limitations, set order to desc",
    async () => {
      const addr = "GCOCZ3ODGW3YH6PPGMLGT3MORS5YBTVJCSL46TC2NMU2KCXGL52XLEZB";
      const ops = await fetchAllOperations(addr, addr, "desc", "241330913827401737");
      expect(ops.length).toEqual(19);
      expect(ops[0].id).toEqual(
        `${addr}-7352d7e754c93b39213288a268efec78843ce8db6fa15f88308c7c852f6806c9-IN`,
      );
      expect(ops[18].id).toEqual(
        `${addr}-af8982997f1765ebbd41b36ab6927825f7083dc3ced07d1d086c1a3ca9c7e3e9-IN`,
      );
    },
    10 * 1_000,
  );

  it(
    "fetch operations with limitations, set order to asc",
    async () => {
      const addr = "GCOCZ3ODGW3YH6PPGMLGT3MORS5YBTVJCSL46TC2NMU2KCXGL52XLEZB";
      const limit = 20;
      const ops = await fetchAllOperations(addr, addr, "asc", "241343201729257475", limit);
      expect(ops.length).toEqual(limit);
      expect(ops[0].id).toEqual(
        `${addr}-71b49018e0ad4f9c72132a89bb58f921158aed3023f7543bab176881ff0b5b14-IN`,
      );
      expect(ops[19].id).toEqual(
        `${addr}-71b49018e0ad4f9c72132a89bb58f921158aed3023f7543bab176881ff0b5b14-IN`,
      );
    },
    10 * 1_000,
  );
});
