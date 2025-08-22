import { getCoinConfig } from "../../config";
import { makeNetworkRequest } from "../network";

const getGraphqlUrl = (): string => {
  const currencyConfig = getCoinConfig();
  // The url doesn't need a route, it's just the base url
  return `${currencyConfig.infra.API_MINA_GRAPHQL_NODE}`;
};

export interface FetchEpochInfoResponse {
  data: {
    daemonStatus: {
      consensusTimeNow: {
        epoch: string;
        slot: string;
        globalSlot: string;
        startTime: string;
        endTime: string;
      };
    };
  };
}
export const getEpochInfo = async (): Promise<FetchEpochInfoResponse> => {
  return await makeNetworkRequest<FetchEpochInfoResponse>({
    method: "POST",
    url: getGraphqlUrl(),
    data: {
      query: ` 
        query {
            daemonStatus {
              consensusTimeNow {
                epoch
                slot
                globalSlot
                startTime
                endTime
              }
            }
          }
      `,
    },
  });
};

export interface FetchDelegateAccountResponse {
  data: {
    account: {
      delegateAccount: {
        publicKey: string;
      };
    } | null;
  };
}
export const getDelegateAccount = async (
  address: string,
): Promise<FetchDelegateAccountResponse> => {
  return await makeNetworkRequest<FetchDelegateAccountResponse>({
    method: "POST",
    url: getGraphqlUrl(),
    data: {
      query: `
        query {
          account(publicKey: "${address}"){
            delegateAccount{
              publicKey
            }
          }
        }
      `,
    },
  });
};
