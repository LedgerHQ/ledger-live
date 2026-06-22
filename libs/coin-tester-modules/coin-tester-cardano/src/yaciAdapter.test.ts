import {
  toApiDelegation,
  toApiTransaction,
  toLatestBlock,
  toProtocolParams,
  type YaciAccount,
  type YaciParams,
  type YaciTxMeta,
  type YaciTxUtxos,
} from "./yaciAdapter";

// A real devnet base address (captured from yaci-devkit boot) — carries a payment credential.
const ADDR =
  "addr_test1qryvgass5dsrf2kxl3vgfz76uhp83kv5lagzcp29tcana68ca5aqa6swlq6llfamln09tal7n5kvt4275ckwedpt4v7q48uhex";

// Live /epochs/latest/parameters values (yaci-devkit@0.10.6).
const PARAMS: YaciParams = {
  min_fee_a: 44,
  min_fee_b: 155381,
  key_deposit: "2000000",
  coins_per_utxo_size: "4310",
  collateral_percent: 150,
  price_step: 0.0000721,
  price_mem: 0.0577,
  max_tx_size: 16384,
  max_val_size: "5000",
  min_fee_ref_script_cost_per_byte: 15,
};

describe("yaciAdapter", () => {
  it("toLatestBlock maps height → blockHeight", () => {
    expect(toLatestBlock({ height: 169 })).toEqual({ blockHeight: 169 });
  });

  it("toProtocolParams maps the live numeric params and keeps a languageView", () => {
    const p = toProtocolParams(PARAMS);
    expect(p.minFeeA).toBe("44");
    expect(p.minFeeB).toBe("155381");
    expect(p.stakeKeyDeposit).toBe("2000000");
    expect(p.utxoCostPerByte).toBe("4310");
    expect(p.lovelacePerUtxoWord).toBe("34480"); // 4310 × 8
    expect(p.maxTxSize).toBe("16384");
    expect(p.maxValueSize).toBe("5000");
    expect(p.collateralPercent).toBe("150");
    expect(p.minFeeRefScriptCostPerByte).toBe("15");
    // languageView (Plutus cost models) comes from the fixture — present, not translated from Yaci.
    expect(p.languageView).toBeDefined();
  });

  it("toApiDelegation returns null when the account is absent", () => {
    expect(toApiDelegation(null, "abc", "2000000")).toBeNull();
  });

  it("toApiDelegation maps an undelegated account (status keyed on pool_id)", () => {
    const account: YaciAccount = {
      stake_address: "stake_test1u...",
      controlled_amount: 10_000_000_000,
      withdrawable_amount: 0,
      pool_id: null,
    };
    const d = toApiDelegation(account, "deadbeef", "2000000")!;
    expect(d.status).toBe(false);
    expect(d.poolInfo).toBeUndefined();
    expect(d.stake).toBe("10000000000");
    expect(d.rewardsAvailable).toBe("0");
    expect(d.deposit).toBe("2000000");
    expect(d.stakeHex).toBe("deadbeef");
  });

  it("toApiDelegation maps a delegated account", () => {
    const account: YaciAccount = {
      stake_address: "stake_test1u...",
      controlled_amount: "9876543210",
      withdrawable_amount: "1234",
      pool_id: "pool1abcdef",
    };
    const d = toApiDelegation(account, "deadbeef", "2000000")!;
    expect(d.status).toBe(true);
    expect(d.poolInfo?.poolId).toBe("pool1abcdef");
    expect(d.rewardsAvailable).toBe("1234");
  });

  it("toApiTransaction maps a native-ADA utxo set (no tokens, empty certs)", () => {
    const utxos: YaciTxUtxos = {
      hash: "6d36c0e2f304a5c27b85b3f04e95fc015566d35aef5f061c17c70e3e8b9ee508",
      inputs: [],
      outputs: [
        {
          tx_hash: "6d36c0e2f304a5c27b85b3f04e95fc015566d35aef5f061c17c70e3e8b9ee508",
          output_index: 0,
          address: ADDR,
          amount: [
            { unit: "lovelace", policy_id: "", asset_name: "lovelace", quantity: "10000000000" },
          ],
        },
      ],
    };
    const meta: YaciTxMeta = { tx_hash: utxos.hash, block_height: 28, block_time: 1700000000 };
    const tx = toApiTransaction(utxos, meta);

    expect(tx.hash).toBe(utxos.hash);
    expect(tx.blockHeight).toBe(28);
    expect(tx.outputs).toHaveLength(1);
    expect(tx.outputs[0].value).toBe("10000000000");
    expect(tx.outputs[0].tokens).toEqual([]);
    expect(tx.outputs[0].paymentKey).toMatch(/^[0-9a-f]{56}$/); // payment credential hex
    expect(tx.certificate.stakeDelegations).toEqual([]);
  });

  it("toApiTransaction splits native tokens out of the lovelace amount", () => {
    const utxos: YaciTxUtxos = {
      hash: "ab".repeat(32),
      inputs: [
        {
          tx_hash: "cd".repeat(32),
          output_index: 1,
          address: ADDR,
          amount: [
            { unit: "lovelace", policy_id: "", asset_name: "lovelace", quantity: "5000000" },
            // unit = policyId(56 hex) + assetNameHex — the canonical Blockfrost form.
            {
              unit: `${"1234".repeat(14)}4d59`,
              policy_id: "1234".repeat(14),
              asset_name: "4d59",
              quantity: "42",
            },
          ],
        },
      ],
      outputs: [],
    };
    const tx = toApiTransaction(utxos, { tx_hash: utxos.hash, block_height: 1 });
    expect(tx.inputs[0].txId).toBe("cd".repeat(32));
    expect(tx.inputs[0].index).toBe(1);
    expect(tx.inputs[0].value).toBe("5000000");
    expect(tx.inputs[0].tokens).toEqual([
      { policyId: "1234".repeat(14), assetName: "4d59", value: "42" },
    ]);
  });
});
