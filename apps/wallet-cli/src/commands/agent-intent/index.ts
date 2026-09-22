import { defineGroup } from "@bunli/core";
import EnrollCommand from "./enroll";
import CompleteCommand from "./complete";
import ListCommand from "./list";
import ShowCommand from "./show";

// NTTVS-745 complete: enroll, complete, list, show, now wired against the published
// @ledgerhq/agent-intent-sdk (NTTVS-767). create/status/cancel (NTTVS-746/747/748/749) still
// follow once the backend agent-scoped read/cancel APIs (NTTVS-809/NTTVS-810) land.
export default defineGroup({
  name: "agent-intent",
  description: "Enroll and manage Agent Intent profiles for AI agents proposing EVM payments.",
  commands: [EnrollCommand, CompleteCommand, ListCommand, ShowCommand],
});
