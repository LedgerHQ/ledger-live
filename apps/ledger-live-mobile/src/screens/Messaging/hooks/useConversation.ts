import {
  conversationTrustchainsSelector,
  memberCredentialsSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector, useStore, useDispatch } from "react-redux";
import { CloudSyncSDK } from "@ledgerhq/live-wallet/cloudsync/index";
import walletsync, {
  liveSlug,
  Schema,
  makeSaveNewUpdate,
} from "@ledgerhq/live-wallet/walletsync/index";
import {
  setAccountNames,
  setNonImportedAccounts,
  conversationsStateSelector,
  setConversation,
  WSState,
} from "@ledgerhq/live-wallet/store";
import { walletSelector, conversationSelector } from "~/reducers/wallet";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { latestDistantStateSelector, latestDistantVersionSelector } from "~/reducers/wallet";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

const latestWalletStateSelector = (s: State): WSState =>
  conversationsStateSelector(conversationSelector(s));

function useGetState() {
  const store = useStore();
  return useCallback(() => store.getState(), [store]);
}

const ctx = {};

export function useCloudSyncSDK(): CloudSyncSDK<Schema> {
  const featureWalletSync = useFeature("llmWalletSync");
  const { cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const dispatch = useDispatch();
  const trustchainSdk = useTrustchainSdk();
  const getState = useGetState();
  const getCurrentVersion = useCallback(
    () => latestWalletStateSelector(getState()).version,
    [getState],
  );

  console.log(latestWalletStateSelector(getState()));

  // saveNewUpdate already works with LiveData, no changes needed here
  const saveNewUpdate = useCallback(
    async (event: any) => {
      console.log(event);
      switch (event.type) {
        case "new-data":
          console.log("Sync: Received new LiveData version", event.version);
          //setConversation(event.data.conversation);
          dispatch(setConversation(event.data.conversation));
          // JSON editor updates via useEffect [data]
          break;
        case "pushed-data":
          console.log("Sync: Pushed LiveData confirmed, new version", event.version);

          break;
        case "deleted-data":
          console.log("Sync: Received delete instruction for LiveData");
          // JSON editor updates via useEffect [data]
          break;
      }
    },
    [], // Removed setJson dependency
  );

  const cloudSyncSDK = useMemo(
    () =>
      new CloudSyncSDK({
        apiBaseUrl: cloudSyncApiBaseUrl,
        slug: liveSlug,
        schema: walletsync.schema,
        trustchainSdk,
        getCurrentVersion,
        saveNewUpdate,
      }),
    [cloudSyncApiBaseUrl, trustchainSdk, getCurrentVersion, saveNewUpdate],
  );

  return cloudSyncSDK;
}

function useConversation() {
  const store = useStore();
  const conversationsSelector = useSelector(conversationTrustchainsSelector);
  const sdk = useTrustchainSdk();
  const dispatch = useDispatch();
  const conversations = useSelector(state => state.wallet.conversationsState.data);
  const walletSyncSdk = useCloudSyncSDK();
  const memberCredentials = useSelector(memberCredentialsSelector);
  useEffect(() => {
    if (conversationsSelector.length === 0) {
      return;
    }

    const pullConversationsSequentially = async () => {
      for (const conversation of conversationsSelector) {
        try {
          const result = await walletSyncSdk.pull(conversation, memberCredentials);
          if (!result) {
            dispatch(
              setConversation({ id: conversation.rootId, messages: [], name: conversation.name }),
            );
          }
        } catch (e) {
          console.error("Error pulling conversation:", e);
        }
      }
    };

    pullConversationsSequentially();
  }, [conversationsSelector, sdk, walletSyncSdk, memberCredentials]);

  const getConversations = useCallback(() => {
    return Object.keys(conversations || {}).map(key => conversations[key]);
  }, [conversations]);

  const sendMessage = useCallback(
    async (conversationId: string, message: string) => {
      const conversation = conversations[conversationId];
      if (!conversation) {
        throw new Error(`Conversation with id ${conversationId} not found`);
      }
      console.log("PUSH MESSAGE", conversation);
      console.log(
        "FOUND CONVERSATION",
        conversationsSelector.find(conv => conv.rootId === conversation.id),
      );
      await walletSyncSdk.push(
        conversationsSelector.find(conv => conv.rootId === conversation.id),
        memberCredentials,
        {
          conversation: {
            conversation: {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  message: message,
                  author: "me",
                  date: Date.now(),
                },
              ],
            },
          },
        },
      );
      await walletSyncSdk.pull(
        conversationsSelector.find(conv => conv.rootId === conversation.id),
        memberCredentials,
      );
    },
    [conversations, memberCredentials, walletSyncSdk],
  );

  const getConversation = useCallback(
    (id: string) => {
      const conversation = conversations[id];
      if (!conversation) {
        throw new Error(`Conversation with id ${id} not found`);
      }
      return {
        ...conversation,
        messages: conversation.messages.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }),
      };
    },
    [conversations],
  );
  console.log("CONVERSATIONS", getConversations());
  return {
    getConversations,
    getConversation,
    sendMessage,
  };
}

export default useConversation;
