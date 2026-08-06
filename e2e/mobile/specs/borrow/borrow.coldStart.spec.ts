import { runBorrowColdStartTest } from "./borrow";
import { BORROW_HOOK_TIMEOUT_MS } from "./borrow.constants";

const borrowTags = ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"];

jest.setTimeout(BORROW_HOOK_TIMEOUT_MS * 2);

runBorrowColdStartTest(borrowTags);
