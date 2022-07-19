import { CryptoCurrency } from "@ledgerhq/cryptoassets";
import { HeliumVote, HeliumVoteResults } from "../types";
import { fetch } from "./sdk";
import { getBlocks } from "./sdk-getBlocks";

/**
 *
 * @returns data fetched from api.
 */
export async function fetchVoteData(currency: CryptoCurrency): Promise<any> {
  const url = "https://heliumvote.com/api/votes";
  const heliumVotes: HeliumVote[] = await fetch(url);
  const currentBlock = await getBlocks(currency);

  // Get all vote results
  for (const vote of heliumVotes) {
    const resultsUrl = `https://heliumvote.com/api/results/${vote.id}`;
    const voteResults: HeliumVoteResults = await fetch(resultsUrl);

    // TODO: Add support for multiple outcomes
    vote.outcomes[0].hntVoted = voteResults.outcomes[1].hntVoted;
    vote.outcomes[0].uniqueWallets = voteResults.outcomes[1].uniqueWallets;
    vote.outcomes[1].hntVoted = voteResults.outcomes[0].hntVoted;
    vote.outcomes[1].uniqueWallets = voteResults.outcomes[0].uniqueWallets;
    vote.timestamp = voteResults.timestamp;
    vote.blocksRemaining = vote.deadline - currentBlock;
  }

  return heliumVotes;
}
