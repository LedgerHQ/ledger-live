import { defineGroup } from "@bunli/core";
import TokenCommand from "./token";
import TokenByIdCommand from "./token-by-id";
import { commandDescription } from "../registry";

export default defineGroup({
  name: "assets",
  description: commandDescription("assets"),
  commands: [TokenCommand, TokenByIdCommand],
});
