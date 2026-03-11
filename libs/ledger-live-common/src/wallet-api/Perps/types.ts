import { ActionWithNonce } from "./server";

type Address = `0x${string}`;
export type Action =
  | {
      type: "order";
      orders: Order[];
      grouping: "na" | "normalTpsl" | "positionTpsl";
      builder?: {
        b: Address; // Address receiving the additionnal fees
        f: number; // Fees
      };
    }
  | {
      type: "modify";
      modifies: {
        oid: number;
        order: Order;
      }[];
    }
  | {
      type: "batchModify";
      modifies: {
        oid: number;
        order: Order;
      }[];
    }
  | {
      type: "cancel";
      cancels: {
        a: number; // asset id
        o: number; // oid
      }[];
    }
  | {
      type: "updateLeverage";
      asset: number; // index of coin
      isCross: boolean; // cross-leverage
      leverage: number;
    }
  | {
      type: "approveBuilderFee";
      hyperliquidChain: "Mainnet" | "Testnet";
      signatureChainId: string; // chainId in hex format. Ex: 0xa4b1 for Arbitrum
      maxFeeRate: string;
      builder: Address;
    }
  | {
      type: "updateIsolatedMargin";
      asset: number; // index of coin
      isBuy: boolean; // cross-leverage
      ntli: number;
    };
export function convertAction(action: ActionWithNonce) {
  return {
    ...action.action,
    nonce: action.nonce,
  };
}
type Order = {
  a: number; // Asset
  b: boolean; // buy: true, sell: false
  p: string; // Price in USDC
  s: string; // Size is the price in coin/token unit
  r: boolean; // reduceOnly
  t:
    | {
        limit: {
          tif: "Alo" | "Ioc" | "Gtc";
        };
      }
    | {
        trigger: {
          isMarket: boolean;
          triggerPx: string;
          tpsl: "tp" | "sl";
        };
      }; // Type
};
