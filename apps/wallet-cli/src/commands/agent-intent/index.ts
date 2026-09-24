import { defineGroup } from "@bunli/core";
import EnrollCommand from "./enroll";
import CompleteCommand from "./complete";
import ListCommand from "./list";
import ShowCommand from "./show";
import SendCommand from "./send";

export default defineGroup({
  name: "agent-intent",
  description: "Enroll Agent Intent profiles and propose EVM payments for human review.",
  commands: [EnrollCommand, CompleteCommand, ListCommand, ShowCommand, SendCommand],
});
