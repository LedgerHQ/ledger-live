import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Btc from "../src/Btc";

describe("splitTransaction", () => {
  test("zcash", async () => {
    const transport = await openTransportReplayer(RecordStore.fromString(""));
    const btc = new Btc({ transport, currency: "zcash" });
    /*

splitTransaction 050000800a27a726b4d0d6c20000000000000000011d73f1a467297aab205ee7a4ed506f28ea558056401b4f6d308016c1b58d27f4010000006a4730440220337050efe67689fdbdccd2058f6f7b7fe3b13070d91cd0d7ecb1f84e622a220b02201356d33259d64db1095879cfce666b016771cf4e239376497b7f82efedd9c54a01210396fcfd94e1bfb2949e0acbab934583c11ad29d14105d25528aff75673c50650c000000000250c30000000000001976a914de3542c396924ada3c5850225770f6dd3e2249b988ac3df2c202000000001976a914fc0da061ca85923e01d97ac276aa8dc890a28efa88ac000000:
TX version 05000080 locktime 00000000 timestamp  nVersionGroupId 0a27a726 nExpiryHeight 00000000 extraData 
input 0: prevout 1d73f1a467297aab205ee7a4ed506f28ea558056401b4f6d308016c1b58d27f401000000 script 4730440220337050efe67689fdbdccd2058f6f7b7fe3b13070d91cd0d7ecb1f84e622a220b02201356d33259d64db1095879cfce666b016771cf4e239376497b7f82efedd9c54a01210396fcfd94e1bfb2949e0acbab934583c11ad29d14105d25528aff75673c50650c sequence 00000000
output 0: amount 50c3000000000000 script 76a914de3542c396924ada3c5850225770f6dd3e2249b988ac
output 1: amount 3df2c20200000000 script 76a914fc0da061ca85923e01d97ac276aa8dc890a28efa88ac
      */
    const tx1 = btc.splitTransaction(
      "050000800a27a726b4d0d6c20000000000000000011d73f1a467297aab205ee7a4ed506f28ea558056401b4f6d308016c1b58d27f4010000006a4730440220337050efe67689fdbdccd2058f6f7b7fe3b13070d91cd0d7ecb1f84e622a220b02201356d33259d64db1095879cfce666b016771cf4e239376497b7f82efedd9c54a01210396fcfd94e1bfb2949e0acbab934583c11ad29d14105d25528aff75673c50650c000000000250c30000000000001976a914de3542c396924ada3c5850225770f6dd3e2249b988ac3df2c202000000001976a914fc0da061ca85923e01d97ac276aa8dc890a28efa88ac000000",
      true,
      true,
      ["zcash", "sapling"],
    );
    /*
       splitTransaction 050000800a27a7265510e7c80000000000000000018c63f70704d9987dafffc5481b171dee900e9b6d71261fee880543bc96c41d11000000006b48304502210098a92ce696ff51d46233885e5ea7d0bc0bcd04621c6d79e4230e579f9b13f1480220772d04b65133859ef7fb146a41080b1187335fed9daf62a237b6bd54657f555d0121039402a22682e936ab3c1e2f649859ba13b39a59bd74212ac903a42b5aea5032790000000002404b4c00000000001976a914c59ace9b52af703379f3f89ebbc8ec1813ca50ec88ac0e532a00000000001976a9144cd6509f71020b6a9e890bef43c4d5e61f9c0dad88ac000000:
TX version 05000080 locktime 00000000 timestamp  nVersionGroupId 0a27a726 nExpiryHeight 00000000 extraData 
input 0: prevout 8c63f70704d9987dafffc5481b171dee900e9b6d71261fee880543bc96c41d1100000000 script 48304502210098a92ce696ff51d46233885e5ea7d0bc0bcd04621c6d79e4230e579f9b13f1480220772d04b65133859ef7fb146a41080b1187335fed9daf62a237b6bd54657f555d0121039402a22682e936ab3c1e2f649859ba13b39a59bd74212ac903a42b5aea503279 sequence 00000000
output 0: amount 404b4c0000000000 script 76a914c59ace9b52af703379f3f89ebbc8ec1813ca50ec88ac
output 1: amount 0e532a0000000000 script 76a9144cd6509f71020b6a9e890bef43c4d5e61f9c0dad88ac
      */
    const tx2 = btc.splitTransaction(
      "050000800a27a7265510e7c80000000000000000018c63f70704d9987dafffc5481b171dee900e9b6d71261fee880543bc96c41d11000000006b48304502210098a92ce696ff51d46233885e5ea7d0bc0bcd04621c6d79e4230e579f9b13f1480220772d04b65133859ef7fb146a41080b1187335fed9daf62a237b6bd54657f555d0121039402a22682e936ab3c1e2f649859ba13b39a59bd74212ac903a42b5aea5032790000000002404b4c00000000001976a914c59ace9b52af703379f3f89ebbc8ec1813ca50ec88ac0e532a00000000001976a9144cd6509f71020b6a9e890bef43c4d5e61f9c0dad88ac000000",
      true,
      true,
      ["zcash", "sapling"],
    );
  });
  test("Zcash Sapling transaction (v4)", async () => {
    const transport = await openTransportReplayer(RecordStore.fromString(""));
    const btc = new Btc({ transport, currency: "zcash" });

    const hex =
      "0400008085202f890177507ef339c27d8d453723c568361fb93671f521f1ba2c42a0f136650939aaa5010000006b48304502210099a9fa0817083a1ce6f96404ed7366d9200f5533a9ccfcd4eddb50be4646c8a102205a6cccc8965f1ea45d6f32d96dda89a3cbb0422fad2a0e05b40fa51c0e51322a0121029f7331870af5630f14fe86e10b6ef696ee152bffb34e71396a4ce82ef64aa23effffffff0240781501000000001976a9144cf48844c49a77ba86e48b070f06151b712c862988ace39e0f02000000001976a91445110888402e6fd0c86329d9eda36c7a3fa354a588ac00000000000000000000000000000000000000";

    const tx = btc.splitTransaction(hex, true, true, ["zcash", "sapling"]);

    expect(tx?.version.toString("hex")).toBe("04000080");
    // expect(tx.nVersionGroupId).toBeDefined();
    expect(tx.nVersionGroupId?.toString("hex")).toBe("85202f89");
    expect(tx.locktime?.toString("hex")).toBe("00000000");
    expect(tx.nExpiryHeight?.toString("hex")).toBe("00000000");

    expect(tx.inputs.length).toBe(1);
    expect(tx.outputs?.length).toBe(2);

    expect(tx.outputs![0].amount.toString("hex")).toBe("4078150100000000")
    expect(tx.outputs![0].script.toString("hex")).toBe("76a9144cf48844c49a77ba86e48b070f06151b712c862988ac");
    
    expect(tx.extraData).toBeDefined();
    expect(tx.extraData?.length).toBe(11); // valueBalance (8) + shieldedSpend (1) + shieldedOutput (1) + joinSplit (1)
    expect(tx.extraData!.toString("hex")).toBe("0000000000000000" + "00" +  "00" + "00"); // empty shielded stuff
  });

  test.only("Zcash NU5 transaction (v5)", async () => {
    const transport = await openTransportReplayer(RecordStore.fromString(""));
    const btc = new Btc({ transport, currency: "zcash" });

    const hex =
      "050000800a27a7265510e7c8000000000000000001b5c51aa7f90bd40671eb4887f0022613f5c773f8a30e0c38ff9fc933b754a218000000006b483045022100b4b7b664f7ac6e78026f81f04f9c6fbd7ccbee532ba53e4150ccb6a7c0bd21510220277b4cfdf44683e77a4211e88a3052be00d1c678c36f357db935450c13f2f33701210223b8ffaccab6cc90d2164bfc4361bb058b030217e7cccf677347f075beeef3bb0000000001c0a79500000000001976a914168bb00f59a2d1a059d7e60fcc709cd5a979992988ac000000";

    const tx = btc.splitTransaction(hex, true, true, ["zcash", "sapling"]);

    expect(tx.version.toString("hex")).toBe("05000080");
    expect(tx.nVersionGroupId?.toString("hex")).toBe("0a27a726");
    expect(tx.locktime?.toString("hex")).toBe("00000000");
    expect(tx.nExpiryHeight?.toString("hex")).toBe("00000000");

    expect(tx.inputs.length).toBe(1);
    expect(tx.outputs?.length).toBe(1);

    expect(tx.outputs![0].amount.toString("hex")).toBe("c0a7950000000000");
    expect(tx.outputs![0].script.toString("hex")).toBe("76a914168bb00f59a2d1a059d7e60fcc709cd5a979992988ac");
    expect(tx.extraData).toBeDefined();
    // Overwinter : use nJoinSplit (1)
    expect(tx.extraData!.length).toBe(0); // no extraData for pure NU5 transparent tx
  });
});
