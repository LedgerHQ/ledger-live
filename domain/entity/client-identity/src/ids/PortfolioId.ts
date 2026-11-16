const PORTFOLIO_ID_SYMBOL = Symbol("portfolioId");

/** Names the install's portfolio on the Portfolio service, which links the install's accounts. */
export class PortfolioId {
  private readonly [PORTFOLIO_ID_SYMBOL]: string;

  static fromString(id: string): PortfolioId {
    return new PortfolioId(id);
  }

  constructor(id: string) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("PortfolioId must be a non-empty string");
    }
    this[PORTFOLIO_ID_SYMBOL] = id;
  }

  toString(): string {
    return "[PortfolioId:REDACTED]";
  }

  toJSON(): string {
    return "[PortfolioId:REDACTED]";
  }

  exportPortfolioIdForPersistence(): string {
    return this[PORTFOLIO_ID_SYMBOL];
  }

  exportPortfolioIdForPortfolioService(): string {
    return this[PORTFOLIO_ID_SYMBOL];
  }

  equals(other: PortfolioId): boolean {
    return this[PORTFOLIO_ID_SYMBOL] === other[PORTFOLIO_ID_SYMBOL];
  }
}
