export type StdRequest = {
  method: string;
  url: string;
  headers: any;
  fileName: string;
  body: any;
  response: any;
};

export type MockContent = {
  request: {
    url: string;
    method: string;
  };
  response: {
    statusCode: number;
    body: any;
  };
};

export type HttpPerformanceEntry = {
  name: "HttpClient";
  entryType: "http" | "http2";
  startTime: number;
  duration: number;
  detail: {
    req?: HttpPerformanceEntryRequest;
    res?: HttpPerformanceEntryResponse;
  };
};

type HeadersMap = { [headerName: string]: string };

export type HttpPerformanceEntryRequest = {
  method: string;
  url: string;
  headers: HeadersMap;
  body?: any;
};

export type HttpPerformanceEntryResponse = {
  statusCode: number;
  statusMessage: string;
  headers: HeadersMap;
};
