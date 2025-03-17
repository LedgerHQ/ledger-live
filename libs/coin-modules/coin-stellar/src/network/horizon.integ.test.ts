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
      expect(ops[0].id).toEqual(`${addr}-241343231793946721-IN`);
      expect(ops[29].id).toEqual(`${addr}-241343231793946692-IN`);
    },
    10 * 1_000,
  );

  it(
    "fetch operations without limitations, set order to desc",
    async () => {
      const addr = "GCOCZ3ODGW3YH6PPGMLGT3MORS5YBTVJCSL46TC2NMU2KCXGL52XLEZB";
      const ops = await fetchAllOperations(addr, addr, "desc", "241330913827401737");
      expect(ops.length).toEqual(19);
      expect(ops[0].id).toEqual(`${addr}-241330913827401736-IN`);
      // https://stellar.coin.ledger.com/accounts/GCOCZ3ODGW3YH6PPGMLGT3MORS5YBTVJCSL46TC2NMU2KCXGL52XLEZB/operations
      expect(ops[18].id).toEqual(`${addr}-241330845108273153-IN`);
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
      expect(ops[0].id).toEqual(`${addr}-241343201729257476-IN`);
      expect(ops[19].id).toEqual(`${addr}-241343201729257495-IN`);
    },
    10 * 1_000,
  );
});
