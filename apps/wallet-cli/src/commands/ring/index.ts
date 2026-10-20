import { defineGroup } from "@bunli/core";
import InitCommand from "./init";
import EncryptCommand from "./encrypt";
import DecryptCommand from "./decrypt";
import KeysCommand from "./keys";
import DestroyCommand from "./destroy";
import { commandDescription } from "../registry";

export default defineGroup({
  name: "ring",
  description: commandDescription("ring"),
  commands: [InitCommand, EncryptCommand, DecryptCommand, KeysCommand, DestroyCommand],
});
