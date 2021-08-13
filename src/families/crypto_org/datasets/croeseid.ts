import type { CurrenciesData } from "../../../types";
import type { Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      // FIXME use better dataset
      // use a seed that we "froze" (aka we'll never use it again, but it contains many txs scenario)
      // then run:
      // ledger-live generateTestScanAccounts -c  crypto_org_croeseid
      name: "crypto_org_croeseid seed gre (temporary)",
      apdus: `
      => 5504000019047463726f2c0000808a010080000000800000000000000000
      <= 02ac96e7f6648484ef48f5cfcd540249c89e4dbfff0553dcf664612c79cfd194297463726f31363734706e6d6b6a6b6c663335703679336e7364357765703378367764656e363438326e79329000
      => 5504000019047463726f2c0000808a010080000000800000000000000000
      <= 02ac96e7f6648484ef48f5cfcd540249c89e4dbfff0553dcf664612c79cfd194297463726f31363734706e6d6b6a6b6c663335703679336e7364357765703378367764656e363438326e79329000
      => 5504000019047463726f2c0000808a010080010000800000000000000000
      <= 02c5546649f7c6f921eb36bd5fef4350cf3a8ff6d33308a4cdf59183cf079c08847463726f31757635307463396d30767534773067333376377937656a687434723636676a66656b347574769000
      `,
    },
  ],
};

export default dataset;
