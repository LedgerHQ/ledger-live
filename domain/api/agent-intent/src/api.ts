import {
  AgentIntentCraftSchema,
  AgentIntentRecordSchema,
  AgentIntentSignatureReceiptSchema,
  AgentIntentStatsSchema,
  AgentProfileRecordSchema,
  type AgentIntentCraft,
  type AgentIntentId,
  type AgentIntentRecord,
  type AgentIntentSignatureReceipt,
  type AgentIntentStats,
  type AgentProfileRecord,
  type AgentPubkey,
} from "@domain/entity-agent-intent";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { agentIntentApi } from "@shared/api-services";
import { z } from "zod";
import { AGENT_INTENT_TAGS } from "./constants";
import { readAgentIntentFailure } from "./failure";
import { parseEach } from "./internals/parseEach";
import { describeSchemaFailure } from "./internals/schemaFailure";
import {
  AgentIntentIdArgSchema,
  AgentIntentListPageRequestSchema,
  AgentPubkeyArgSchema,
  AgentIntentSignatureSubmissionSchema,
  CreateAgentProfileArgsSchema,
  MissingAgentProfileBodySchema,
  UpdateAgentProfileArgsSchema,
} from "./schema";
import type {
  AgentIntentListArgs,
  AgentIntentPage,
  AgentIntentSignatureSubmission,
  AgentIntentStatsArgs,
  AgentProfileList,
  CreateAgentProfileArgs,
  UpdateAgentProfileArgs,
} from "./types";

const ListBodySchema = z.array(z.unknown());

const AgentProfileOrMissingSchema = z.union([
  AgentProfileRecordSchema,
  MissingAgentProfileBodySchema,
]);

const INTENT_LIST = { type: "AgentIntent", id: "LIST" } as const;
const PROFILE_LIST = { type: "AgentProfile", id: "LIST" } as const;

function intentPath(intentId: AgentIntentId, step?: "craft" | "signature" | "reject"): string {
  const path = `v1/intents/${encodeURIComponent(intentId)}`;
  return step ? `${path}/${step}` : path;
}

function profilePath(agentPubkey: AgentPubkey): string {
  return `v1/agent-profiles/${encodeURIComponent(agentPubkey)}`;
}

function intentListParams(args: AgentIntentListArgs, cursor: string | null) {
  if (cursor) return { cursor };
  return { status: args.status?.join(","), pageSize: args.pageSize, agentPubkey: args.agentPubkey };
}

/** The shared base query types its meta as `{}`; at runtime it is `fetchBaseQuery`'s. */
function readNextCursor(meta: unknown): string | undefined {
  const response =
    typeof meta === "object" && meta !== null ? Reflect.get(meta, "response") : undefined;
  return response instanceof Response
    ? response.headers.get("X-Ledger-Next") || undefined
    : undefined;
}

function toIntentPage(items: unknown[], meta: unknown): AgentIntentPage {
  const { records, unreadable } = parseEach(AgentIntentRecordSchema, items, "id");
  const nextCursor = readNextCursor(meta);
  return nextCursor
    ? { intents: records, nextCursor, unreadable }
    : { intents: records, unreadable };
}

/** Stops on a cursor already followed, so a BFF that repeats one can't loop the reading. */
function nextIntentCursor(
  lastPage: AgentIntentPage,
  allPages: AgentIntentPage[],
): string | undefined {
  const { nextCursor } = lastPage;
  const alreadyFollowed = allPages.slice(0, -1).some(page => page.nextCursor === nextCursor);
  return nextCursor && !alreadyFollowed ? nextCursor : undefined;
}

function isMissingProfile(response: Response, body: unknown): boolean {
  return response.status === 404 && MissingAgentProfileBodySchema.safeParse(body).success;
}

/** RTK Query runs `invalidatesTags` with the raw argument even when `argSchema` refused it. */
function tagsIfSent<Arg, Tag>(
  error: FetchBaseQueryError | undefined,
  arg: Arg,
  tags: (sent: Arg) => Tag[],
): Tag[] {
  return readAgentIntentFailure(error)?.kind === "invalid-request" ? [] : tags(arg);
}

export const agentIntentReviewerApi = agentIntentApi
  .enhanceEndpoints({ addTagTypes: AGENT_INTENT_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getAgentIntents: build.infiniteQuery<AgentIntentPage, AgentIntentListArgs, string | null>({
        query: ({ queryArg, pageParam }) => ({
          url: "v1/intents",
          params: intentListParams(queryArg, pageParam),
        }),
        argSchema: AgentIntentListPageRequestSchema,
        rawResponseSchema: ListBodySchema,
        transformResponse: (items: unknown[], meta) => toIntentPage(items, meta),
        catchSchemaFailure: describeSchemaFailure,
        providesTags: result => [
          INTENT_LIST,
          ...(result?.pages.flatMap(page =>
            page.intents.map(intent => ({ type: "AgentIntent" as const, id: intent.id })),
          ) ?? []),
        ],
        infiniteQueryOptions: { initialPageParam: null, getNextPageParam: nextIntentCursor },
      }),

      getAgentIntent: build.query<AgentIntentRecord, AgentIntentId>({
        query: intentId => intentPath(intentId),
        argSchema: AgentIntentIdArgSchema,
        rawResponseSchema: AgentIntentRecordSchema,
        transformResponse: (record: AgentIntentRecord) => record,
        catchSchemaFailure: describeSchemaFailure,
        providesTags: (_result, _error, intentId) => [{ type: "AgentIntent", id: intentId }],
      }),

      getAgentIntentStats: build.query<AgentIntentStats, AgentIntentStatsArgs>({
        query: args => ({ url: "v1/intents/stats", params: { agentPubkey: args?.agentPubkey } }),
        responseSchema: AgentIntentStatsSchema,
        catchSchemaFailure: describeSchemaFailure,
        providesTags: ["AgentIntentStats"],
      }),

      /** Send intents only: a swap needs craft parameters, and swaps are out of this release. */
      craftAgentIntent: build.mutation<AgentIntentCraft, AgentIntentId>({
        query: intentId => ({ url: intentPath(intentId, "craft"), method: "POST" }),
        argSchema: AgentIntentIdArgSchema,
        rawResponseSchema: AgentIntentCraftSchema,
        transformResponse: (craft: AgentIntentCraft) => craft,
        catchSchemaFailure: describeSchemaFailure,
        invalidatesTags: (_result, error, intentId) =>
          tagsIfSent(error, intentId, id => [{ type: "AgentIntent", id }, INTENT_LIST]),
      }),

      submitAgentIntentSignature: build.mutation<
        AgentIntentSignatureReceipt,
        AgentIntentSignatureSubmission
      >({
        query: ({ intentId, signature, revision }) => ({
          url: intentPath(intentId, "signature"),
          method: "POST",
          body: { signature, revision },
        }),
        argSchema: AgentIntentSignatureSubmissionSchema,
        rawResponseSchema: AgentIntentSignatureReceiptSchema,
        transformResponse: (receipt: AgentIntentSignatureReceipt) => receipt,
        catchSchemaFailure: describeSchemaFailure,
        invalidatesTags: (_result, error, submission) =>
          tagsIfSent(error, submission, ({ intentId }) => [
            { type: "AgentIntent", id: intentId },
            INTENT_LIST,
            "AgentIntentStats",
          ]),
      }),

      rejectAgentIntent: build.mutation<void, AgentIntentId>({
        query: intentId => ({ url: intentPath(intentId, "reject"), method: "POST" }),
        argSchema: AgentIntentIdArgSchema,
        catchSchemaFailure: describeSchemaFailure,
        invalidatesTags: (_result, error, intentId) =>
          tagsIfSent(error, intentId, id => [
            { type: "AgentIntent", id },
            INTENT_LIST,
            "AgentIntentStats",
          ]),
      }),

      getAgentProfiles: build.query<AgentProfileList, void>({
        query: () => "v1/agent-profiles",
        rawResponseSchema: ListBodySchema,
        transformResponse: (items: unknown[]) => {
          const { records, unreadable } = parseEach(AgentProfileRecordSchema, items, "agentPubkey");
          return { profiles: records, unreadable };
        },
        catchSchemaFailure: describeSchemaFailure,
        providesTags: result => [
          PROFILE_LIST,
          ...(result?.profiles.map(profile => ({
            type: "AgentProfile" as const,
            id: profile.agentPubkey,
          })) ?? []),
        ],
      }),

      getAgentProfile: build.query<AgentProfileRecord | null, AgentPubkey>({
        query: agentPubkey => ({
          url: profilePath(agentPubkey),
          validateStatus: (response, body) => response.ok || isMissingProfile(response, body),
        }),
        argSchema: AgentPubkeyArgSchema,
        rawResponseSchema: AgentProfileOrMissingSchema,
        transformResponse: (body: z.output<typeof AgentProfileOrMissingSchema>) =>
          "agentPubkey" in body ? body : null,
        catchSchemaFailure: describeSchemaFailure,
        providesTags: (_result, _error, agentPubkey) => [{ type: "AgentProfile", id: agentPubkey }],
      }),

      createAgentProfile: build.mutation<void, CreateAgentProfileArgs>({
        query: ({ agentPubkey, profile }) => ({
          url: profilePath(agentPubkey),
          method: "POST",
          body: profile,
        }),
        argSchema: CreateAgentProfileArgsSchema,
        catchSchemaFailure: describeSchemaFailure,
        invalidatesTags: (_result, error, args) =>
          tagsIfSent(error, args, ({ agentPubkey }) => [
            PROFILE_LIST,
            { type: "AgentProfile", id: agentPubkey },
          ]),
      }),

      updateAgentProfile: build.mutation<void, UpdateAgentProfileArgs>({
        query: ({ agentPubkey, update }) => ({
          url: profilePath(agentPubkey),
          method: "PATCH",
          body: update,
        }),
        argSchema: UpdateAgentProfileArgsSchema,
        catchSchemaFailure: describeSchemaFailure,
        invalidatesTags: (_result, error, args) =>
          tagsIfSent(error, args, ({ agentPubkey }) => [
            PROFILE_LIST,
            { type: "AgentProfile", id: agentPubkey },
          ]),
      }),

      deleteAgentProfile: build.mutation<void, AgentPubkey>({
        query: agentPubkey => ({ url: profilePath(agentPubkey), method: "DELETE" }),
        argSchema: AgentPubkeyArgSchema,
        catchSchemaFailure: describeSchemaFailure,
        invalidatesTags: (_result, error, agentPubkey) =>
          tagsIfSent(error, agentPubkey, id => [PROFILE_LIST, { type: "AgentProfile", id }]),
      }),
    }),
  });

export const {
  useGetAgentIntentsInfiniteQuery,
  useGetAgentIntentQuery,
  useGetAgentIntentStatsQuery,
  useCraftAgentIntentMutation,
  useSubmitAgentIntentSignatureMutation,
  useRejectAgentIntentMutation,
  useGetAgentProfilesQuery,
  useGetAgentProfileQuery,
  useCreateAgentProfileMutation,
  useUpdateAgentProfileMutation,
  useDeleteAgentProfileMutation,
} = agentIntentReviewerApi;
