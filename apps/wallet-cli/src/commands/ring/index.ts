import { defineGroup } from "@bunli/core";
import InitCommand from "./init";
import EncryptCommand from "./encrypt";
import DecryptCommand from "./decrypt";
import KeysCommand from "./keys";
import DestroyCommand from "./destroy";

export default defineGroup({
  name: "ring",
  description: "Ledger Key Ring — trustless, hardware-rooted encryption for files and text (LKRP)",
  commands: [InitCommand, EncryptCommand, DecryptCommand, KeysCommand, DestroyCommand],
});
