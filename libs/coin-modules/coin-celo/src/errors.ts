export class CeloAllFundsWarning extends Error {
  override name = "CeloAllFundsWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CeloAllFundsWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class CeloGroupNotVotable extends Error {
  override name = "CeloGroupNotVotable";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CeloGroupNotVotable");
    if (fields) Object.assign(this, fields);
  }
}

export class CeloGroupNotVoted extends Error {
  override name = "CeloGroupNotVoted";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CeloGroupNotVoted");
    if (fields) Object.assign(this, fields);
  }
}
