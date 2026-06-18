export class CeloAllFundsWarning extends Error {
  override name = "CeloAllFundsWarning";
  constructor(message = "CeloAllFundsWarning") {
    super(message);
  }
}
export class CeloGroupNotVotable extends Error {
  override name = "CeloGroupNotVotable";
  constructor(message = "CeloGroupNotVotable") {
    super(message);
  }
}
