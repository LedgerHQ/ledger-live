import { stakePromptCaseChunks } from "./stakePromptFixtures";
import { describeStakePromptCaseChunk } from "./stakePromptCaseTests";

// Each part runs a case chunk so the test runner can parallelize the stake prompt flow.
describeStakePromptCaseChunk(stakePromptCaseChunks[0], 1);
