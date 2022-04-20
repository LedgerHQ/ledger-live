import { map, switchMap } from "rxjs/operators";
import {
  accountFormatters,
  decodeAccountId,
} from "@ledgerhq/live-common/lib/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { getCurrencyBridge } from "@ledgerhq/live-common/lib/bridge";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
export default {
  description: "Synchronize accounts with blockchain",
  args: [
    ...scanCommonOpts,
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: Object.keys(accountFormatters).join(" | "),
      desc: "how to display the data",
    },
  ],
  job: (
    opts: ScanCommonOpts & {
      format: string;
    }
  ) =>
    scan(opts).pipe(
      switchMap(async (account) => {
        const { currencyId } = decodeAccountId(account.id);
        const currency = getCryptoCurrencyById(currencyId);
        const currencyBridge = getCurrencyBridge(currency);
        const { nftResolvers } = currencyBridge;

        return account.nfts?.length && nftResolvers?.nftMetadata
          ? {
              ...account,
              nfts: await Promise.all(
                account.nfts.map(async (nft) => {
                  const { result: metadata } = await nftResolvers?.nftMetadata({
                    contract: nft.contract,
                    tokenId: nft.tokenId,
                    currencyId: nft.currencyId,
                  });

                  return { ...nft, metadata };
                })
              ).catch(() => account.nfts),
            }
          : account;
      }),
      map((account) =>
        (accountFormatters[opts.format] || accountFormatters.default)(account)
      )
    ),
};
