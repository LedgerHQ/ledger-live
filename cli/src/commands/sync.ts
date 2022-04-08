import { map, switchMap } from "rxjs/operators";
import { accountFormatters } from "@ledgerhq/live-common/lib/account";
import { metadataCallBatcher } from "@ledgerhq/live-common/lib/nft";
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
      switchMap(async (account) =>
        account.nfts?.length
          ? {
              ...account,
              nfts: await Promise.all(
                account.nfts.map(async (nft) => {
                  const { result: metadata } = await metadataCallBatcher.load({
                    contract: nft.collection.contract,
                    tokenId: nft.tokenId,
                  });

                  return { ...nft, metadata };
                })
              ).catch(() => account.nfts),
            }
          : account
      ),
      map((account) =>
        (accountFormatters[opts.format] || accountFormatters.default)(account)
      )
    ),
};
