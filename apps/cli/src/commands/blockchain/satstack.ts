import fs from "fs";
import invariant from "invariant";
import { from, of, forkJoin, firstValueFrom } from "rxjs";
import { map, reduce, first, catchError } from "rxjs/operators";
import { setEnv } from "@ledgerhq/live-env";
import Btc from "@ledgerhq/hw-app-btc";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { AccountDescriptor, scanDescriptors } from "@ledgerhq/coin-bitcoin/descriptor";
import type { SignerContext } from "@ledgerhq/coin-bitcoin/signer";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import {
  parseSatStackConfig,
  stringifySatStackConfig,
  editSatStackConfig,
  checkRPCNodeConfig,
  validateRPCNodeConfig,
  RPCNodeConfig,
} from "@ledgerhq/live-common/families/bitcoin/satstack";
import { deviceOpt } from "../../scan";
import { jsonFromFile } from "../../stream";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const bitcoin = getCryptoCurrencyById("bitcoin");

function requiredNodeConfig(nodeConfig: RPCNodeConfig | undefined) {
  invariant(nodeConfig, "--rpcHOST,--rpcUSER,--rpcPASSWORD config required");
  const errors = validateRPCNodeConfig(nodeConfig!);

  if (errors.length) {
    throw new Error(errors.map(e => e.field + ": " + e.error.message).join(", "));
  }

  return nodeConfig!;
}

export type SatstackJobOpts = {
  "no-device": boolean;
  "no-save": boolean;
  device: string;
  lss: string;
  rpcHOST: string;
  rpcUSER: string;
  rpcPASSWORD: string;
  rpcTLS: boolean;
};

export default {
  description: "SatStack: Generate and manage lss.json file",
  args: [
    deviceOpt,
    {
      name: "no-device",
      type: Boolean,
      desc: "disable the scanning of device descriptors",
    },
    {
      name: "no-save",
      type: Boolean,
      desc: "disable the save of the lss file",
    },
    {
      name: "lss",
      type: String,
      typeDesc: "filename",
      desc: "A file to save the sats stack state",
    },
    {
      name: "rpcHOST",
      type: String,
      desc: "host to rpc full node (e.g. 127.0.0.1:8332)",
    },
    {
      name: "rpcUSER",
      type: String,
      desc: "username of full node",
    },
    {
      name: "rpcPASSWORD",
      type: String,
      desc: "password of full node",
    },
    {
      name: "rpcTLS",
      type: Boolean,
      desc: "use tls in full node",
    },
  ],
  job: ({
    "no-device": noDevice,
    "no-save": noSave,
    device,
    lss,
    rpcHOST,
    rpcUSER,
    rpcPASSWORD,
    rpcTLS,
  }: SatstackJobOpts) => {
    setEnv("SATSTACK", true);
    const maybeExistingConfigO = !lss
      ? of(null)
      : jsonFromFile(lss, true).pipe(
          map(parseSatStackConfig),
          first(),
          catchError(() => of(null)),
        );
    const signerContext: SignerContext = <T>(
      deviceId: string,
      currency: CryptoCurrency,
      fn: (signer: Btc) => Promise<T>,
    ): Promise<T> =>
      firstValueFrom(
        withDevice(deviceId)(transport => from(fn(new Btc({ transport, currency: currency.id })))),
      );
    const maybeDescriptorsO = noDevice
      ? of([])
      : scanDescriptors(device || "", bitcoin, signerContext).pipe(
          reduce((acc, item) => acc.concat(item), [] as AccountDescriptor[]),
        );
    const maybeNodeConfigOverride = rpcHOST
      ? requiredNodeConfig({
          host: rpcHOST,
          username: rpcUSER,
          password: rpcPASSWORD,
          tls: !!rpcTLS,
        })
      : null;
    return forkJoin({
      initialConfig: maybeExistingConfigO,
      descriptors: maybeDescriptorsO,
      checkedRPCNodeConfig: maybeNodeConfigOverride
        ? from(checkRPCNodeConfig(maybeNodeConfigOverride))
        : of(null),
    }).pipe(
      map(a => {
        const { initialConfig, descriptors } = a;
        const patch = {
          node: requiredNodeConfig(
            maybeNodeConfigOverride || (initialConfig ? initialConfig.node : undefined),
          ),
          accounts: descriptors.map(descriptor => ({
            descriptor,
          })),
        };
        const config = initialConfig ? editSatStackConfig(initialConfig, patch) : patch;
        const str = stringifySatStackConfig(config);

        if (lss && !noSave) {
          fs.writeFileSync(lss, str);
          return lss + " saved!";
        }

        return str;
      }),
    );
  },
};
