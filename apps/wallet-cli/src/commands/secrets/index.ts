import { defineGroup } from "@bunli/core";
import InitCommand from "./init";
import EncryptCommand from "./encrypt";
import DecryptCommand from "./decrypt";
import KeysCommand from "./keys";
import DestroyCommand from "./destroy";

export default defineGroup({
  name: "secrets",
  description: "Hardware-backed file encryption using the trustchain",
  commands: [InitCommand, EncryptCommand, DecryptCommand, KeysCommand, DestroyCommand],
});
