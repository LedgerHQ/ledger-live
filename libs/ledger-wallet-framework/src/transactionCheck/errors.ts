export class TransactionCheckPotentialRisk extends Error {
  override name = "TransactionCheckPotentialRisk";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TransactionCheckPotentialRisk");
    if (fields) Object.assign(this, fields);
  }
}

export class TransactionCheckCriticalThreat extends Error {
  override name = "TransactionCheckCriticalThreat";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TransactionCheckCriticalThreat");
    if (fields) Object.assign(this, fields);
  }
}
