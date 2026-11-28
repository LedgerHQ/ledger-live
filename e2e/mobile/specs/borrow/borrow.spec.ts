import { runBorrowTests } from "@e2e/specs/borrow/borrow";

runBorrowTests({
  tmsLinks: { openLoan: "B2CQA-6065", repay: "B2CQA-6073", withdraw: "B2CQA-6080" },
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});
