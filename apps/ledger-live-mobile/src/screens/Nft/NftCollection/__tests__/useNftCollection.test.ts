import { useSelector } from "react-redux";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useNftCollection } from "../useNftCollection";
import { NavigatorName, ScreenName } from "~/const";
import { groupAccountOperationsByDay } from "@ledgerhq/coin-framework/account/groupOperations";
import { act, renderHook } from "@testing-library/react-native";
import { RouteProp } from "@react-navigation/native";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import BigNumber from "bignumber.js";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/featureFlags/useFeature", () => jest.fn());
jest.mock("@ledgerhq/coin-framework/lib/account/groupOperations", () => ({
  groupAccountOperationsByDay: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(),
  isFocused: jest.fn(),
  getParent: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  reset: jest.fn(),
  getId: jest.fn(),
  getState: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute: RouteProp<AccountsNavigatorParamList, ScreenName.NftCollection> = {
  key: "mockKey",
  name: ScreenName.NftCollection,
  params: {
    collection: [
      {
        contract: "contract1",
        currencyId: "ethereum",
        id: "11",
        tokenId: "1",
        amount: new BigNumber(1),
        standard: "ERC721",
      },
    ],
    accountId: "account1",
  },
};

const mockRouteSolana: RouteProp<AccountsNavigatorParamList, ScreenName.NftCollection> = {
  key: "mockKey",
  name: ScreenName.NftCollection,
  params: {
    collection: [
      {
        contract: "contract2",
        currencyId: "solana",
        id: "22",
        tokenId: "2",
        amount: new BigNumber(1),
        standard: "ERC721",
      },
    ],
    accountId: "account1",
  },
};

const mockAccount = {
  id: "account1",
  nftOperations: [{ contract: "contract1" }, { contract: "contract2" }],
};

const mockState = {
  accounts: {
    active: [mockAccount],
  },
};

describe("useNftCollection", () => {
  beforeEach(() => {
    (useSelector as jest.Mock).mockImplementation(selector => selector(mockRoute));
    (useSelector as jest.Mock).mockImplementation(selector => selector(mockState));
    (useFeature as jest.Mock).mockReturnValue({ enabled: true });
    (groupAccountOperationsByDay as jest.Mock).mockReturnValue({
      sections: [],
      completed: true,
    });
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() =>
      useNftCollection({ route: mockRoute, navigation: mockNavigation }),
    );

    expect(result.current.nftCount).toBe(12);
    expect(result.current.opCount).toBe(100);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.nfts).toEqual(mockRoute.params.collection.slice(0, 12));
    expect(result.current.isNFTDisabled).toBe(true);
    expect(result.current.displaySendBtn).toBe(true);
  });

  it("should increase nftCount when onNftsEndReached is called", () => {
    const { result } = renderHook(() =>
      useNftCollection({ route: mockRoute, navigation: mockNavigation }),
    );

    act(() => {
      result.current.onNftsEndReached();
    });

    expect(result.current.nftCount).toBe(18);
  });

  it("should increase opCount when onOperationsEndReached is called", () => {
    const { result } = renderHook(() =>
      useNftCollection({ route: mockRoute, navigation: mockNavigation }),
    );

    act(() => {
      result.current.onOperationsEndReached();
    });

    expect(result.current.opCount).toBe(150);
  });

  it("should open and close modal", () => {
    const { result } = renderHook(() =>
      useNftCollection({ route: mockRoute, navigation: mockNavigation }),
    );

    act(() => {
      result.current.onOpenModal();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onCloseModal();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("should navigate to SendFunds screen when sendToken is called", () => {
    const { result } = renderHook(() =>
      useNftCollection({ route: mockRoute, navigation: mockNavigation }),
    );

    act(() => {
      result.current.sendToken();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendNft,
      params: {
        account: mockAccount,
        collection: mockRoute.params.collection,
      },
    });
  });

  it("should disable send button for Solana NFTs", () => {
    const { result } = renderHook(() =>
      useNftCollection({ route: mockRouteSolana, navigation: mockNavigation }),
    );

    expect(result.current.displaySendBtn).toBe(false);
  });
});
