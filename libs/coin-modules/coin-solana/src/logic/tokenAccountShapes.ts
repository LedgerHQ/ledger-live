import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getTokenAccountProgramId } from "../helpers/token";
import type { ChainAPI } from "../network";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import {
  getMaybeTokenMint,
  getTokenAccruedInterestDelta,
  toTokenAccountWithInfo,
} from "../network/chain/web3";
import type { ParsedOnChainTokenAccountWithInfo } from "../network/chain/web3";
import type { MintExtensions } from "../network/chain/account/tokenExtensions";
import type { SolanaTokenAccountExtensions } from "../types";
import type { TokenAccountState } from "../network/chain/account/token";

/** The family fields a Solana token sub-account carries beyond its amount. */
export type TokenAccountShape = {
  state?: TokenAccountState;
  extensions?: SolanaTokenAccountExtensions;
};

/** The frozen state and Token-2022 extensions of the address's token accounts, keyed by mint. */
export async function getTokenAccountShapes(
  api: ChainAPI,
  address: string,
): Promise<Record<string, TokenAccountShape>> {
  const [splTokenAccounts, token2022Accounts] = await Promise.all([
    api.getParsedTokenAccountsByOwner(address).then(res => res.value),
    api.getParsedToken2022AccountsByOwner(address).then(res => res.value),
  ]);

  const shapes: Record<string, TokenAccountShape> = {};

  const owner = new PublicKey(address);
  const entries = [
    ...splTokenAccounts.map(account => ({ account, tokenProgram: PARSED_PROGRAMS.SPL_TOKEN })),
    ...token2022Accounts.map(account => ({
      account,
      tokenProgram: PARSED_PROGRAMS.SPL_TOKEN_2022,
    })),
  ];

  await Promise.all(
    entries.map(async ({ account, tokenProgram }) => {
      // Through the parser: it is what turns the raw `mint` and `owner` strings into `PublicKey`s.
      const assocTokenAcc = toTokenAccountWithInfo(account);
      const { info } = assocTokenAcc;
      const mint = info.mint.toBase58();

      // One account per mint here, so keep the associated one, as `getBalance` does.
      const associatedAddress = getAssociatedTokenAddressSync(
        info.mint,
        owner,
        undefined,
        getTokenAccountProgramId(tokenProgram),
      );
      if (!associatedAddress.equals(account.pubkey)) return;

      // Only a Token-2022 mint declares extensions.
      const mintExtensions =
        tokenProgram === PARSED_PROGRAMS.SPL_TOKEN_2022
          ? await maybeMintExtensions(api, mint)
          : undefined;

      shapes[mint] = {
        ...(info.state ? { state: info.state } : {}),
        ...(mintExtensions || info.extensions
          ? { extensions: await toSolanaTokenAccExtensions(api, assocTokenAcc, mintExtensions) }
          : {}),
      };
    }),
  );

  return shapes;
}

async function maybeMintExtensions(
  api: ChainAPI,
  mint: string,
): Promise<MintExtensions | undefined> {
  const mintOrError = await getMaybeTokenMint(mint, api);
  if (!mintOrError || mintOrError instanceof Error) return undefined;
  if (mintOrError.onChainAcc.data.program !== PARSED_PROGRAMS.SPL_TOKEN_2022) return undefined;
  return mintOrError.info.extensions;
}

export async function toSolanaTokenAccExtensions(
  api: ChainAPI,
  assocTokenAcc: ParsedOnChainTokenAccountWithInfo,
  mintExtensions?: MintExtensions,
) {
  const extensions = [...(mintExtensions || []), ...(assocTokenAcc.info.extensions || [])];
  return extensions.reduce<Promise<SolanaTokenAccountExtensions>>(async (prevPromise, tokenExt) => {
    const acc = await prevPromise;
    switch (tokenExt.extension) {
      case "interestBearingConfig": {
        const delta = await getTokenAccruedInterestDelta(
          api,
          BigNumber(assocTokenAcc.info.tokenAmount.amount),
          assocTokenAcc.info.tokenAmount.decimals,
          assocTokenAcc.info.mint.toBase58(),
          assocTokenAcc.info.owner.toBase58(),
        );
        return {
          ...acc,
          interestRate: {
            rateBps: tokenExt.state.currentRate,
            accruedDelta: delta?.toNumber(),
          },
        };
      }
      case "nonTransferable":
        return { ...acc, nonTransferable: true };
      case "permanentDelegate":
        return {
          ...acc,
          permanentDelegate: { delegateAddress: tokenExt.state?.delegate?.toBase58() },
        };
      case "memoTransfer":
        return { ...acc, requiredMemoOnTransfer: !!tokenExt.state.requireIncomingTransferMemos };
      case "transferFeeConfig": {
        const { epoch } = await api.getEpochInfo();
        const { newerTransferFee, olderTransferFee } = tokenExt.state;
        const transferFee = epoch >= newerTransferFee.epoch ? newerTransferFee : olderTransferFee;
        return {
          ...acc,
          transferFee: {
            feeBps: transferFee.transferFeeBasisPoints,
            maxFee: transferFee.maximumFee,
          },
        };
      }
      case "transferHook": {
        return {
          ...acc,
          transferHook: { programAddress: tokenExt.state?.programId?.toBase58() },
        };
      }
      default:
        return acc;
    }
  }, Promise.resolve({}));
}
