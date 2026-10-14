import { useCheckOfacGeoBlockQuery } from "@domain/api-ofac";

type CheckQueryResult = {
  data?: boolean;
  isLoading: boolean;
  isError?: boolean;
};

export function mockOfacCheckQuery(
  mockedUseCheckQuery: jest.MockedFunction<typeof useCheckOfacGeoBlockQuery>,
  result: CheckQueryResult,
): void {
  mockedUseCheckQuery.mockReturnValue(
    result as unknown as ReturnType<typeof useCheckOfacGeoBlockQuery>,
  );
}
