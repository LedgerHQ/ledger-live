import { selectWalletSyncState } from "@domain/entity-wallet-sync";
import getApi from "@ledgerhq/ledger-key-ring-protocol/api";
import { NoTrustchainInitialized } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import {
  createQRCodeCandidateInstance,
  createQRCodeHostInstance,
} from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";
import {
  CloudSyncSDK,
  getCloudSyncApi,
  type MemberCredentials,
  type Trustchain,
} from "@shared/cloud-sync";
import type { DistantDocument } from "@shared/cloud-sync-module";
import { makeSaveNewUpdate } from "../incrementalUpdates";
import { liveSlug, trustchainLifecycle } from "../trustchainLifecycle";
import type { LedgerSyncMiddlewareConfig, LedgerSyncStateRoot } from "../types";

const LEDGER_WALLET_LKRP_APPLICATION_ID = 16;

/** This instance in a pairing: its trustchain when it has one, and its member credentials. */
type QrCodeSession = { trustchain: Trustchain | null; memberCredentials: MemberCredentials };
type HostOptions = Parameters<typeof createQRCodeHostInstance>[0];
type JoinOptions = Parameters<typeof createQRCodeCandidateInstance>[0];

export function createLedgerSyncServices<S extends LedgerSyncStateRoot, LocalState, Update>(
  { getState, dispatch }: MiddlewareAPI<Dispatch, S>,
  { lkrp, cloudSync }: LedgerSyncMiddlewareConfig<S, LocalState, Update>,
) {
  const lkrpSdk = getSdk(
    lkrp.isMockEnv(),
    {
      applicationId: LEDGER_WALLET_LKRP_APPLICATION_ID,
      name: lkrp.getInstanceName(),
      apiBaseUrl: lkrp.apiBaseUrl,
    },
    lkrp.withDevice,
    cloudSync.reencryptOnRotation
      ? trustchainLifecycle({
          cloudSyncApiBaseUrl: cloudSync.apiBaseUrl,
          getCurrentWSState: () => selectWalletSyncState(getState()),
        })
      : undefined,
  );

  const cloudSyncSdk = new CloudSyncSDK<DistantDocument>({
    apiBaseUrl: cloudSync.apiBaseUrl,
    slug: liveSlug,
    trustchainSdk: lkrpSdk,
    getCurrentVersion: () => selectWalletSyncState(getState()).version,
    saveNewUpdate: async (event, trustchain) => {
      // A call that settles after a reset or a new pairing would restore the old session's data.
      if (trustchainSelector(getState())?.rootId !== trustchain.rootId) return;
      await makeSaveNewUpdate({
        walletsync: cloudSync.walletsyncSelector(getState()),
        getState,
        latestDistantStateSelector: state => selectWalletSyncState(state).data,
        latestDistantVersionSelector: state => selectWalletSyncState(state).version,
        localStateSelector: cloudSync.localStateSelector,
        saveUpdate: (data, version, newLocalState) =>
          cloudSync.save(data, version, newLocalState, dispatch),
      })(event);
    },
  });

  // A pairing joins the other instance to this one's trustchain when it has one.
  const asMember = ({ trustchain, memberCredentials }: QrCodeSession) => ({
    memberCredentials,
    memberName: lkrp.getInstanceName(),
    initialTrustchainId: trustchain?.rootId,
    addMember: async (member: TrustchainMember) => {
      if (!trustchain) throw new NoTrustchainInitialized();
      await lkrpSdk.addMember(trustchain, memberCredentials, member);
      return trustchain;
    },
  });

  return {
    lkrpSdk,
    cloudSyncSdk,
    lkrpQrCode: {
      host: ({
        onDisplayQRCode,
        onDisplayDigits,
        ...session
      }: QrCodeSession & Pick<HostOptions, "onDisplayQRCode" | "onDisplayDigits">) =>
        createQRCodeHostInstance({
          ...asMember(session),
          trustchainApiBaseUrl: lkrp.apiBaseUrl,
          onDisplayQRCode,
          onDisplayDigits,
        }),
      join: ({
        scannedUrl,
        onRequestQRCodeInput,
        ...session
      }: QrCodeSession & Pick<JoinOptions, "scannedUrl" | "onRequestQRCodeInput">) =>
        createQRCodeCandidateInstance({ ...asMember(session), scannedUrl, onRequestQRCodeInput }),
    },
    status: {
      fetchLkrpStatus: () => getApi(lkrp.apiBaseUrl).fetchStatus(),
      fetchCloudSyncStatus: () => getCloudSyncApi(cloudSync.apiBaseUrl).fetchStatus(),
    },
  };
}
