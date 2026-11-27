import { configureStore, type SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { AgentIntentSignature } from "@domain/entity-agent-intent";
import {
  mockAgentIntentRecord,
  mockAgentIntentSignatureReceipt,
  mockAgentIntentStats,
  mockAgentProfileRecord,
  mockEvmAgentIntentCraft,
} from "@domain/entity-agent-intent/schema.mock";
import { agentIntentApi } from "@shared/api-services";
import { http, HttpResponse } from "msw";
import {
  AGENT_INTENT_CRAFT_URL,
  AGENT_INTENT_REJECT_URL,
  AGENT_INTENT_SIGNATURE_URL,
  AGENT_INTENT_STATS_URL,
  AGENT_INTENT_URL,
  AGENT_INTENTS_URL,
  AGENT_PROFILE_URL,
  AGENT_PROFILES_URL,
  agentIntentErrorResponse,
  listenToAgentIntentApi,
  mockAgentIntentApiExtraArgument,
  mockAgentIntentAuthMiddleware,
} from "./agentIntentApi.mock";
import { agentIntentReviewerApi } from "./api";
import { readAgentIntentFailure } from "./failure";

const FIRST_ID = "019ac3e2-5b7d-7c41-9a2e-3f6b8d0c1e24";
const SECOND_ID = "019ac3e2-5b7d-7c41-9a2e-3f6b8d0c1e25";
const intent = mockAgentIntentRecord({ id: FIRST_ID });
const intentId = intent.id;
const profile = mockAgentProfileRecord();
const agentPubkey = profile.agentPubkey;
const signature = `0x${"ab".repeat(64)}1b` as AgentIntentSignature;

const endpoints = agentIntentReviewerApi.endpoints;

type Route = jest.Mock<Response, [{ request: Request; params: Record<string, unknown> }]>;

function route(): Route {
  return jest.fn();
}

const routes = {
  listIntents: route(),
  getIntent: route(),
  stats: route(),
  craft: route(),
  signature: route(),
  reject: route(),
  listProfiles: route(),
  getProfile: route(),
  createProfile: route(),
  updateProfile: route(),
  deleteProfile: route(),
};

const server = listenToAgentIntentApi();

beforeEach(() => {
  for (const endpoint of Object.values(routes)) {
    endpoint
      .mockReset()
      .mockImplementation(() => agentIntentErrorResponse(500, "Unexpected request."));
  }
  server.use(
    http.get(AGENT_INTENT_STATS_URL, routes.stats),
    http.get(AGENT_INTENTS_URL, routes.listIntents),
    http.get(AGENT_INTENT_URL, routes.getIntent),
    http.post(AGENT_INTENT_CRAFT_URL, routes.craft),
    http.post(AGENT_INTENT_SIGNATURE_URL, routes.signature),
    http.post(AGENT_INTENT_REJECT_URL, routes.reject),
    http.get(AGENT_PROFILES_URL, routes.listProfiles),
    http.get(AGENT_PROFILE_URL, routes.getProfile),
    http.post(AGENT_PROFILE_URL, routes.createProfile),
    http.patch(AGENT_PROFILE_URL, routes.updateProfile),
    http.delete(AGENT_PROFILE_URL, routes.deleteProfile),
  );
});

function makeStore() {
  return configureStore({
    reducer: { [agentIntentApi.reducerPath]: agentIntentApi.reducer },
    middleware: gdm =>
      gdm({ thunk: { extraArgument: mockAgentIntentApiExtraArgument() } })
        .concat(mockAgentIntentAuthMiddleware())
        .concat(agentIntentApi.middleware),
  });
}

type Store = ReturnType<typeof makeStore>;

function sent(endpoint: Route, call = 0): Request {
  return endpoint.mock.calls[call][0].request;
}

async function settleRunningQueries(store: Store): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
  await Promise.all(store.dispatch(agentIntentApi.util.getRunningQueriesThunk()));
}

const subscribeToIntents = (store: Store) => store.dispatch(endpoints.getAgentIntents.initiate({}));
const subscribeToProfiles = (store: Store) => store.dispatch(endpoints.getAgentProfiles.initiate());

describe("agentIntentReviewerApi", () => {
  it("should inject into the Agent Intent service api", () => {
    expect(agentIntentReviewerApi).toBe(agentIntentApi);
  });

  it("should authenticate with the agent-intent provider", async () => {
    routes.getIntent.mockImplementation(() => HttpResponse.json(intent));

    await makeStore().dispatch(endpoints.getAgentIntent.initiate(intentId));

    expect(sent(routes.getIntent).headers.get("authorization")).toBe("Bearer agent-intent-token");
  });
});

describe("getAgentIntents", () => {
  it("should send the filters on the first page and read the next cursor from its header", async () => {
    routes.listIntents.mockImplementation(() =>
      HttpResponse.json([intent], { headers: { "X-Ledger-Next": "cursor-2" } }),
    );

    const result = await makeStore().dispatch(
      endpoints.getAgentIntents.initiate({
        status: ["created", "crafted"],
        pageSize: 50,
        agentPubkey,
      }),
    );

    const query = new URL(sent(routes.listIntents).url).searchParams;
    expect(query.get("status")).toBe("created,crafted");
    expect(query.get("pageSize")).toBe("50");
    expect(query.get("agentPubkey")).toBe(agentPubkey);
    expect(result.data?.pages).toEqual([
      { intents: [intent], nextCursor: "cursor-2", unreadable: [] },
    ]);
  });

  it("should ask for a next page with its cursor alone, and stop when no cursor follows", async () => {
    const second = mockAgentIntentRecord({ id: SECOND_ID });
    routes.listIntents
      .mockImplementationOnce(() =>
        HttpResponse.json([intent], { headers: { "X-Ledger-Next": "cursor-2" } }),
      )
      .mockImplementationOnce(() => HttpResponse.json([second]));
    const store = makeStore();
    const args = { status: ["signed" as const] };

    await store.dispatch(endpoints.getAgentIntents.initiate(args));
    const result = await store.dispatch(
      endpoints.getAgentIntents.initiate(args, { direction: "forward" }),
    );
    const afterTheEnd = await store.dispatch(
      endpoints.getAgentIntents.initiate(args, { direction: "forward" }),
    );

    expect(new URL(sent(routes.listIntents, 1).url).search).toBe("?cursor=cursor-2");
    expect(result.data?.pages.map(page => page.intents.map(({ id }) => id))).toEqual([
      [FIRST_ID],
      [SECOND_ID],
    ]);
    expect(afterTheEnd.hasNextPage).toBe(false);
    expect(routes.listIntents).toHaveBeenCalledTimes(2);
  });

  it("should stop on a cursor it already followed", async () => {
    routes.listIntents.mockImplementation(() =>
      HttpResponse.json([intent], { headers: { "X-Ledger-Next": "same" } }),
    );
    const store = makeStore();

    await store.dispatch(endpoints.getAgentIntents.initiate({}));
    const result = await store.dispatch(
      endpoints.getAgentIntents.initiate({}, { direction: "forward" }),
    );

    expect(result.hasNextPage).toBe(false);
  });

  it("should leave out an intent that fails its schema and keep the others", async () => {
    const broken = { ...mockAgentIntentRecord({ id: SECOND_ID }), createdAt: "yesterday" };
    routes.listIntents.mockImplementation(() => HttpResponse.json([intent, broken]));

    const result = await makeStore().dispatch(endpoints.getAgentIntents.initiate({}));

    const [page] = result.data?.pages ?? [];
    expect(page.intents).toEqual([intent]);
    expect(page.unreadable).toEqual([
      { id: SECOND_ID, issues: expect.stringContaining("createdAt") },
    ]);
  });

  it("should fail when the body is not a list", async () => {
    routes.listIntents.mockImplementation(() => HttpResponse.json({ intents: [] }));

    const result = await makeStore().dispatch(endpoints.getAgentIntents.initiate({}));

    expect(readAgentIntentFailure(result.error)).toEqual({ kind: "unreadable-response" });
  });

  it("should refuse an empty status filter without a request", async () => {
    const result = await makeStore().dispatch(endpoints.getAgentIntents.initiate({ status: [] }));

    expect(readAgentIntentFailure(result.error)).toMatchObject({ kind: "invalid-request" });
    expect(routes.listIntents).not.toHaveBeenCalled();
  });
});

describe("getAgentIntent", () => {
  it("should read one intent", async () => {
    routes.getIntent.mockImplementation(() => HttpResponse.json(intent));

    const result = await makeStore().dispatch(endpoints.getAgentIntent.initiate(intentId));

    expect(routes.getIntent.mock.calls[0][0].params.intentId).toBe(FIRST_ID);
    expect(result.data).toEqual(intent);
  });

  it("should give the message of an untyped BFF error", async () => {
    routes.getIntent.mockImplementation(() =>
      agentIntentErrorResponse(404, `Intent ${FIRST_ID} not found`),
    );

    const result = await makeStore().dispatch(endpoints.getAgentIntent.initiate(intentId));

    expect(readAgentIntentFailure(result.error)).toEqual({
      kind: "http",
      status: 404,
      message: `Intent ${FIRST_ID} not found`,
    });
  });
});

describe("getAgentIntentStats", () => {
  it("should read the counts of one agent", async () => {
    routes.stats.mockImplementation(() => HttpResponse.json(mockAgentIntentStats()));

    const result = await makeStore().dispatch(
      endpoints.getAgentIntentStats.initiate({ agentPubkey }),
    );

    expect(new URL(sent(routes.stats).url).searchParams.get("agentPubkey")).toBe(agentPubkey);
    expect(result.data).toEqual(mockAgentIntentStats());
  });

  it("should read the counts of every agent without a filter", async () => {
    routes.stats.mockImplementation(() => HttpResponse.json(mockAgentIntentStats()));

    await makeStore().dispatch(endpoints.getAgentIntentStats.initiate());

    expect(new URL(sent(routes.stats).url).search).toBe("");
  });

  it("should fail on counts it can't read", async () => {
    routes.stats.mockImplementation(() =>
      HttpResponse.json({ total: -1, approved: 0, rejected: 0 }),
    );

    const result = await makeStore().dispatch(endpoints.getAgentIntentStats.initiate());

    expect(readAgentIntentFailure(result.error)).toEqual({ kind: "unreadable-response" });
  });
});

describe("craftAgentIntent", () => {
  it("should post without a body and read the crafted transaction", async () => {
    routes.craft.mockImplementation(() => HttpResponse.json(mockEvmAgentIntentCraft()));

    const result = await makeStore().dispatch(endpoints.craftAgentIntent.initiate(intentId));

    expect(await sent(routes.craft).text()).toBe("");
    expect(result.data).toEqual(mockEvmAgentIntentCraft());
  });

  it("should refetch the intent lists after crafting", async () => {
    routes.listIntents.mockImplementation(() => HttpResponse.json([]));
    routes.craft.mockImplementation(() => HttpResponse.json(mockEvmAgentIntentCraft()));
    const store = makeStore();
    await store.dispatch(endpoints.getAgentIntents.initiate({ status: ["crafted"] }));

    await store.dispatch(endpoints.craftAgentIntent.initiate(intentId));
    await settleRunningQueries(store);

    expect(routes.listIntents).toHaveBeenCalledTimes(2);
  });

  it("should tell a stale revision apart", async () => {
    routes.craft.mockImplementation(() =>
      agentIntentErrorResponse(409, "Stale revision.", "stale_revision"),
    );

    const result = await makeStore().dispatch(endpoints.craftAgentIntent.initiate(intentId));

    expect(readAgentIntentFailure(result.error)).toMatchObject({
      status: 409,
      type: "stale_revision",
    });
  });
});

describe("submitAgentIntentSignature", () => {
  const submission = { intentId, signature, revision: 2 };

  it("should post the signature and its revision, and read the receipt", async () => {
    routes.signature.mockImplementation(() => HttpResponse.json(mockAgentIntentSignatureReceipt()));

    const result = await makeStore().dispatch(
      endpoints.submitAgentIntentSignature.initiate(submission),
    );

    expect(await sent(routes.signature).json()).toEqual({ signature, revision: 2 });
    expect(result.data).toEqual(mockAgentIntentSignatureReceipt());
  });

  it("should say the BFF acted when a 2xx receipt can't be read", async () => {
    routes.signature.mockImplementation(() => HttpResponse.json({}));

    const result = await makeStore().dispatch(
      endpoints.submitAgentIntentSignature.initiate(submission),
    );

    expect(readAgentIntentFailure(result.error)).toEqual({ kind: "unreadable-response" });
  });

  it("should refuse a malformed signature without a request", async () => {
    const result = await makeStore().dispatch(
      endpoints.submitAgentIntentSignature.initiate({
        ...submission,
        signature: "0xABC" as AgentIntentSignature,
      }),
    );

    expect(readAgentIntentFailure(result.error)).toMatchObject({ kind: "invalid-request" });
    expect(routes.signature).not.toHaveBeenCalled();
  });

  it("should refetch the intent list and the counts it changed", async () => {
    routes.listIntents.mockImplementation(() => HttpResponse.json([intent]));
    routes.stats.mockImplementation(() => HttpResponse.json(mockAgentIntentStats()));
    routes.signature.mockImplementation(() => HttpResponse.json(mockAgentIntentSignatureReceipt()));
    const store = makeStore();
    await store.dispatch(endpoints.getAgentIntents.initiate({}));
    await store.dispatch(endpoints.getAgentIntentStats.initiate());

    await store.dispatch(endpoints.submitAgentIntentSignature.initiate(submission));
    await settleRunningQueries(store);

    expect(routes.listIntents).toHaveBeenCalledTimes(2);
    expect(routes.stats).toHaveBeenCalledTimes(2);
  });

  it("should still refetch them after a failure the BFF may have acted on", async () => {
    routes.listIntents.mockImplementation(() => HttpResponse.json([intent]));
    routes.stats.mockImplementation(() => HttpResponse.json(mockAgentIntentStats()));
    routes.signature.mockImplementation(() => agentIntentErrorResponse(502, "Bad gateway."));
    const store = makeStore();
    await store.dispatch(endpoints.getAgentIntents.initiate({}));
    await store.dispatch(endpoints.getAgentIntentStats.initiate());

    await store.dispatch(endpoints.submitAgentIntentSignature.initiate(submission));
    await settleRunningQueries(store);

    expect(routes.listIntents).toHaveBeenCalledTimes(2);
    expect(routes.stats).toHaveBeenCalledTimes(2);
  });
});

describe("rejectAgentIntent", () => {
  it("should post the rejection and refetch the counts", async () => {
    routes.stats.mockImplementation(() => HttpResponse.json(mockAgentIntentStats()));
    routes.reject.mockImplementation(() => new HttpResponse(null, { status: 204 }));
    const store = makeStore();
    await store.dispatch(endpoints.getAgentIntentStats.initiate());

    const result = await store.dispatch(endpoints.rejectAgentIntent.initiate(intentId));
    await settleRunningQueries(store);

    expect(result.error).toBeUndefined();
    expect(routes.reject).toHaveBeenCalledTimes(1);
    expect(routes.stats).toHaveBeenCalledTimes(2);
  });

  it("should refuse an id that isn't one without a request", async () => {
    const result = await makeStore().dispatch(
      endpoints.rejectAgentIntent.initiate(".." as typeof intentId),
    );

    expect(readAgentIntentFailure(result.error)).toMatchObject({ kind: "invalid-request" });
    expect(routes.reject).not.toHaveBeenCalled();
  });
});

describe("getAgentProfiles", () => {
  it("should leave out a profile that fails its schema and keep the others", async () => {
    const broken = { ...mockAgentProfileRecord({ agentPubkey: "03ff" }), profile: null };
    routes.listProfiles.mockImplementation(() => HttpResponse.json([profile, broken]));

    const result = await makeStore().dispatch(endpoints.getAgentProfiles.initiate());

    expect(result.data).toEqual({
      profiles: [profile],
      unreadable: [{ id: "03ff", issues: expect.stringContaining("profile") }],
    });
  });
});

describe("getAgentProfile", () => {
  it("should read the profile", async () => {
    routes.getProfile.mockImplementation(() => HttpResponse.json(profile));

    const result = await makeStore().dispatch(endpoints.getAgentProfile.initiate(agentPubkey));

    expect(result.data).toEqual(profile);
  });

  it("should give null when the agent has no profile", async () => {
    routes.getProfile.mockImplementation(() =>
      agentIntentErrorResponse(404, "Agent profile not found."),
    );

    const result = await makeStore().dispatch(endpoints.getAgentProfile.initiate(agentPubkey));

    expect(result.error).toBeUndefined();
    expect(result.data).toBeNull();
  });

  it("should keep a 404 from anything else an error", async () => {
    routes.getProfile.mockImplementation(() =>
      HttpResponse.json({ message: "no Route matched with those values" }, { status: 404 }),
    );

    const result = await makeStore().dispatch(endpoints.getAgentProfile.initiate(agentPubkey));

    expect(readAgentIntentFailure(result.error)).toMatchObject({ kind: "http", status: 404 });
  });

  it("should report an unreadable response when a 200 carries the missing-profile message", async () => {
    routes.getProfile.mockImplementation(() =>
      HttpResponse.json({ message: "Agent profile not found." }),
    );

    const result = await makeStore().dispatch(endpoints.getAgentProfile.initiate(agentPubkey));

    expect(result.data).toBeUndefined();
    expect(readAgentIntentFailure(result.error)).toEqual({ kind: "unreadable-response" });
  });

  it("should report an unreadable response when a 200 has no body", async () => {
    routes.getProfile.mockImplementation(() => new HttpResponse(null, { status: 200 }));

    const result = await makeStore().dispatch(endpoints.getAgentProfile.initiate(agentPubkey));

    expect(readAgentIntentFailure(result.error)).toEqual({ kind: "unreadable-response" });
  });

  it("should refuse a key that isn't one without a request", async () => {
    const result = await makeStore().dispatch(
      endpoints.getAgentProfile.initiate(".." as typeof agentPubkey),
    );

    expect(readAgentIntentFailure(result.error)).toMatchObject({ kind: "invalid-request" });
    expect(routes.getProfile).not.toHaveBeenCalled();
  });
});

describe("agent profile writes", () => {
  it("should create a profile with trimmed fields", async () => {
    routes.createProfile.mockImplementation(() => new HttpResponse(null, { status: 201 }));

    const result = await makeStore().dispatch(
      endpoints.createAgentProfile.initiate({
        agentPubkey,
        profile: {
          name: " Research agent ",
          description: "Pays for API calls.",
          source: "openclaw",
        },
      }),
    );

    expect(result.error).toBeUndefined();
    expect(await sent(routes.createProfile).json()).toEqual({
      name: "Research agent",
      description: "Pays for API calls.",
      source: "openclaw",
    });
  });

  it("should refuse a profile over the limits without a request", async () => {
    const result = await makeStore().dispatch(
      endpoints.createAgentProfile.initiate({
        agentPubkey,
        profile: { name: "n".repeat(81), description: "d", source: "openclaw" },
      }),
    );

    expect(readAgentIntentFailure(result.error)).toMatchObject({ kind: "invalid-request" });
    expect(routes.createProfile).not.toHaveBeenCalled();
  });

  it("should patch only the fields it updates", async () => {
    routes.updateProfile.mockImplementation(() => new HttpResponse(null, { status: 200 }));

    const result = await makeStore().dispatch(
      endpoints.updateAgentProfile.initiate({ agentPubkey, update: { description: "New text." } }),
    );

    expect(result.error).toBeUndefined();
    expect(routes.updateProfile).toHaveBeenCalledTimes(1);
    expect(await sent(routes.updateProfile).json()).toEqual({ description: "New text." });
  });

  it("should delete a profile and refetch the profile list", async () => {
    routes.listProfiles.mockImplementation(() => HttpResponse.json([profile]));
    routes.deleteProfile.mockImplementation(() => new HttpResponse(null, { status: 204 }));
    const store = makeStore();
    await store.dispatch(endpoints.getAgentProfiles.initiate());

    await store.dispatch(endpoints.deleteAgentProfile.initiate(agentPubkey));
    await settleRunningQueries(store);

    expect(routes.deleteProfile).toHaveBeenCalledTimes(1);
    expect(routes.listProfiles).toHaveBeenCalledTimes(2);
  });
});

describe("a refused argument", () => {
  type Missing = null | undefined;
  type Refusal = {
    name: string;
    refuse: (
      store: Store,
      missing: Missing,
    ) => Promise<{ error?: FetchBaseQueryError | SerializedError }>;
    route: Route;
    list: Route;
    subscribe: (store: Store) => Promise<unknown>;
  };

  const refusals: Refusal[] = [
    {
      name: "craftAgentIntent",
      refuse: (store, missing) =>
        store.dispatch(endpoints.craftAgentIntent.initiate(missing as never)),
      route: routes.craft,
      list: routes.listIntents,
      subscribe: subscribeToIntents,
    },
    {
      name: "submitAgentIntentSignature",
      refuse: (store, missing) =>
        store.dispatch(endpoints.submitAgentIntentSignature.initiate(missing as never)),
      route: routes.signature,
      list: routes.listIntents,
      subscribe: subscribeToIntents,
    },
    {
      name: "rejectAgentIntent",
      refuse: (store, missing) =>
        store.dispatch(endpoints.rejectAgentIntent.initiate(missing as never)),
      route: routes.reject,
      list: routes.listIntents,
      subscribe: subscribeToIntents,
    },
    {
      name: "createAgentProfile",
      refuse: (store, missing) =>
        store.dispatch(endpoints.createAgentProfile.initiate(missing as never)),
      route: routes.createProfile,
      list: routes.listProfiles,
      subscribe: subscribeToProfiles,
    },
    {
      name: "updateAgentProfile",
      refuse: (store, missing) =>
        store.dispatch(endpoints.updateAgentProfile.initiate(missing as never)),
      route: routes.updateProfile,
      list: routes.listProfiles,
      subscribe: subscribeToProfiles,
    },
    {
      name: "deleteAgentProfile",
      refuse: (store, missing) =>
        store.dispatch(endpoints.deleteAgentProfile.initiate(missing as never)),
      route: routes.deleteProfile,
      list: routes.listProfiles,
      subscribe: subscribeToProfiles,
    },
  ];

  describe.each([null, undefined])("%s", missing => {
    it.each(refusals)(
      "should refuse it in $name without a request or a refetch",
      async ({ refuse, route: refusedRoute, list, subscribe }) => {
        routes.listIntents.mockImplementation(() => HttpResponse.json([intent]));
        routes.listProfiles.mockImplementation(() => HttpResponse.json([profile]));
        const store = makeStore();
        await subscribe(store);

        const result = await refuse(store, missing);
        await settleRunningQueries(store);

        expect(readAgentIntentFailure(result.error)).toMatchObject({ kind: "invalid-request" });
        expect(refusedRoute).not.toHaveBeenCalled();
        expect(list).toHaveBeenCalledTimes(1);
      },
    );
  });
});
