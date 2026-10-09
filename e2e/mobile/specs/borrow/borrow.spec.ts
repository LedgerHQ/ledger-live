import { runBorrowTests } from "@e2e/specs/borrow/borrow";

runBorrowTests({ openLoan: "B2CQA-6065", repay: "B2CQA-6073", withdraw: "B2CQA-6080" }, [
  "@NanoSP",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@ethereum",
  "@family-evm",
]);
