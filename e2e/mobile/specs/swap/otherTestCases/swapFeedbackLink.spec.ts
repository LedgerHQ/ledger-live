import { runSwapHistoryFeedbackTest } from "./swap.other";

const swapFeedbackTestConfig = {
  tmsLinks: ["B2CQA-2370"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@solana",
    "@family-solana",
    "@ethereum",
    "@family-evm",
  ],
};

runSwapHistoryFeedbackTest(swapFeedbackTestConfig.tmsLinks, swapFeedbackTestConfig.tags);
