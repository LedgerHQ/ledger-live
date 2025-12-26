import { ProtocolParams } from "../types";

export const getProtocolParamsFixture = (): ProtocolParams => ({
  minFeeA: "44",
  minFeeB: "155381",
  stakeKeyDeposit: "2000000",
  lovelacePerUtxoWord: "34482",
  collateralPercent: "150",
  priceSteps: "0.0000721",
  priceMem: "0.0577",
  maxTxSize: "16384",
  maxValueSize: "5000",
  utxoCostPerByte: "4310",
  minFeeRefScriptCostPerByte: "15",
  languageView: {
    PlutusScriptV1: [],
    PlutusScriptV2: [],
    PlutusScriptV3: [],
  },
});
