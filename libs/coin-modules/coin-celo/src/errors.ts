export class CeloAllFundsWarning extends Error {
  override name = "CeloAllFundsWarning";
  constructor(message?: string) {
    super(message || "CeloAllFundsWarning");
  }
}
export class CeloGroupNotVotable extends Error {
  override name = "CeloGroupNotVotable";
  constructor(message?: string) {
    super(message || "CeloGroupNotVotable");
  }
}
export class CeloGroupNotVoted extends Error {
  override name = "CeloGroupNotVoted";
  constructor(message?: string) {
    super(message || "CeloGroupNotVoted");
  }
}
