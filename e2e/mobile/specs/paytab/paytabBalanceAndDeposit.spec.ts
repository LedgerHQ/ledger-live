import { runPayBalanceAndDepositTest, runPayRequestTest } from "@e2e/specs/paytab/paytab";

const tags = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

runPayBalanceAndDepositTest(["B2CQA-6325"], tags);
runPayRequestTest(["B2CQA-6326"], tags);
