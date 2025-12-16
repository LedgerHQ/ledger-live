import {
  isFetchBaseQueryError,
  isNetworkError,
  isApiError,
  getApiErrorStatus,
  parseError,
} from "../errorUtils";

describe("errorUtils", () => {
  describe("isFetchBaseQueryError", () => {
    it("should return true for FetchBaseQueryError with FETCH_ERROR status", () => {
      const error = { status: "FETCH_ERROR", error: "Failed to fetch" };
      expect(isFetchBaseQueryError(error)).toBe(true);
    });

    it("should return true for FetchBaseQueryError with numeric status", () => {
      const error = { status: 500, data: { message: "Internal Server Error" } };
      expect(isFetchBaseQueryError(error)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isFetchBaseQueryError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isFetchBaseQueryError(undefined)).toBe(false);
    });

    it("should return false for object without status", () => {
      const error = { message: "Some error" };
      expect(isFetchBaseQueryError(error)).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isFetchBaseQueryError("error")).toBe(false);
      expect(isFetchBaseQueryError(123)).toBe(false);
    });
  });

  describe("isNetworkError", () => {
    it("should return true for FETCH_ERROR", () => {
      const error = { status: "FETCH_ERROR", error: "Failed to fetch" };
      expect(isNetworkError(error)).toBe(true);
    });

    it("should return true for TIMEOUT_ERROR", () => {
      const error = { status: "TIMEOUT_ERROR", error: "Request timed out" };
      expect(isNetworkError(error)).toBe(true);
    });

    it("should return false for PARSING_ERROR", () => {
      const error = { status: "PARSING_ERROR", error: "Invalid JSON" };
      expect(isNetworkError(error)).toBe(false);
    });

    it("should return false for numeric status (API error)", () => {
      const error = { status: 500, data: { message: "Server error" } };
      expect(isNetworkError(error)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isNetworkError(undefined)).toBe(false);
    });

    it("should return false for non-FetchBaseQueryError", () => {
      const error = { message: "Some error" };
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe("isApiError", () => {
    it("should return true for 4xx status codes", () => {
      expect(isApiError({ status: 400, data: {} })).toBe(true);
      expect(isApiError({ status: 401, data: {} })).toBe(true);
      expect(isApiError({ status: 404, data: {} })).toBe(true);
    });

    it("should return true for 5xx status codes", () => {
      expect(isApiError({ status: 500, data: {} })).toBe(true);
      expect(isApiError({ status: 502, data: {} })).toBe(true);
      expect(isApiError({ status: 503, data: {} })).toBe(true);
    });

    it("should return false for FETCH_ERROR", () => {
      const error = { status: "FETCH_ERROR", error: "Failed to fetch" };
      expect(isApiError(error)).toBe(false);
    });

    it("should return false for TIMEOUT_ERROR", () => {
      const error = { status: "TIMEOUT_ERROR", error: "Request timed out" };
      expect(isApiError(error)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isApiError(undefined)).toBe(false);
    });

    it("should return false for non-FetchBaseQueryError", () => {
      expect(isApiError({ message: "error" })).toBe(false);
    });
  });

  describe("getApiErrorStatus", () => {
    it("should return status code for API errors", () => {
      expect(getApiErrorStatus({ status: 400, data: {} })).toBe(400);
      expect(getApiErrorStatus({ status: 500, data: {} })).toBe(500);
    });

    it("should return undefined for FETCH_ERROR", () => {
      const error = { status: "FETCH_ERROR", error: "Failed to fetch" };
      expect(getApiErrorStatus(error)).toBeUndefined();
    });

    it("should return undefined for TIMEOUT_ERROR", () => {
      const error = { status: "TIMEOUT_ERROR", error: "Request timed out" };
      expect(getApiErrorStatus(error)).toBeUndefined();
    });

    it("should return undefined for undefined error", () => {
      expect(getApiErrorStatus(undefined)).toBeUndefined();
    });

    it("should return undefined for non-FetchBaseQueryError", () => {
      expect(getApiErrorStatus({ message: "error" })).toBeUndefined();
    });
  });

  describe("parseError", () => {
    it("should return correct ErrorInfo for network error (FETCH_ERROR)", () => {
      const error = { status: "FETCH_ERROR", error: "Failed to fetch" };
      const result = parseError(error);

      expect(result).toEqual({
        hasError: true,
        isNetworkError: true,
        isApiError: false,
        apiStatus: undefined,
      });
    });

    it("should return correct ErrorInfo for network error (TIMEOUT_ERROR)", () => {
      const error = { status: "TIMEOUT_ERROR", error: "Request timed out" };
      const result = parseError(error);

      expect(result).toEqual({
        hasError: true,
        isNetworkError: true,
        isApiError: false,
        apiStatus: undefined,
      });
    });

    it("should return correct ErrorInfo for API error", () => {
      const error = { status: 500, data: { message: "Internal Server Error" } };
      const result = parseError(error);

      expect(result).toEqual({
        hasError: true,
        isNetworkError: false,
        isApiError: true,
        apiStatus: 500,
      });
    });

    it("should return correct ErrorInfo for 404 error", () => {
      const error = { status: 404, data: { message: "Not Found" } };
      const result = parseError(error);

      expect(result).toEqual({
        hasError: true,
        isNetworkError: false,
        isApiError: true,
        apiStatus: 404,
      });
    });

    it("should return default ErrorInfo for undefined error", () => {
      const result = parseError(undefined);

      expect(result).toEqual({
        hasError: false,
        isNetworkError: false,
        isApiError: false,
        apiStatus: undefined,
      });
    });

    it("should return default ErrorInfo for null error", () => {
      const result = parseError(null);

      expect(result).toEqual({
        hasError: false,
        isNetworkError: false,
        isApiError: false,
        apiStatus: undefined,
      });
    });

    it("should return ErrorInfo with hasError true for non-FetchBaseQueryError", () => {
      const result = parseError({ message: "Some generic error" });

      expect(result).toEqual({
        hasError: true,
        isNetworkError: false,
        isApiError: false,
        apiStatus: undefined,
      });
    });

    it("should return ErrorInfo with hasError true for PARSING_ERROR", () => {
      const error = { status: "PARSING_ERROR", error: "Invalid JSON" };
      const result = parseError(error);

      expect(result).toEqual({
        hasError: true,
        isNetworkError: false,
        isApiError: false,
        apiStatus: undefined,
      });
    });
  });
});
