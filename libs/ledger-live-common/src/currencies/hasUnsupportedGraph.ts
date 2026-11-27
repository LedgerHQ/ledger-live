import { vechainTokenIdsWithUnsupportedGraph } from "../families/vechain/tokensWithUnsupportedGraph";

const TOKEN_IDS_WITH_UNSUPPORTED_GRAPH = new Set<string>([...vechainTokenIdsWithUnsupportedGraph]);

export const hasUnsupportedGraph = (tokenId: string): boolean =>
  TOKEN_IDS_WITH_UNSUPPORTED_GRAPH.has(tokenId);
