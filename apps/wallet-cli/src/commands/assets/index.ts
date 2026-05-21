import { defineGroup } from "@bunli/core";
import TokenCommand from "./token";
import TokenByIdCommand from "./token-by-id";

export default defineGroup({
  name: "assets",
  description: "Crypto-assets store queries (resolve tokens by address or id)",
  commands: [TokenCommand, TokenByIdCommand],
});
