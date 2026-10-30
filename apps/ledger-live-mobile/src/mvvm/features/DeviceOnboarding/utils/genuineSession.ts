type SessionVerdict = {
  sessionId: string;
  genuineVerdict: { sessionId: string; isGenuine: boolean } | null;
};

export function isCurrentSessionGenuine(context: SessionVerdict | null | undefined): boolean {
  const verdict = context?.genuineVerdict;
  if (!verdict || verdict.sessionId !== context?.sessionId) return false;
  return verdict.isGenuine;
}
