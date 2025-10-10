import { createIndexedDBCacheAdapter } from "../implementations/indexed-db.web";
import { runCacheAdapterTests } from "./test-helpers";

// Global store to share data between instances
const globalStore = new Map<string, any>();

// Simple but working IndexedDB mock
const mockIndexedDB = {
  open: jest.fn(() => {
    const request = {
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: {
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            get: jest.fn((key: string) => {
              const result = globalStore.get(key) || undefined;
              const mockRequest = {
                onerror: null,
                onsuccess: null,
                result: result,
              };
              // Trigger onsuccess immediately
              setTimeout(() => {
                if (mockRequest.onsuccess) {
                  mockRequest.onsuccess({ target: mockRequest });
                }
              }, 0);
              return mockRequest;
            }),
            put: jest.fn((value: any, key: string) => {
              globalStore.set(key, value);
              const mockRequest = {
                onerror: null,
                onsuccess: null,
              };
              // Trigger onsuccess immediately
              setTimeout(() => {
                if (mockRequest.onsuccess) {
                  mockRequest.onsuccess({ target: mockRequest });
                }
              }, 0);
              return mockRequest;
            }),
            delete: jest.fn((key: string) => {
              globalStore.delete(key);
              const mockRequest = {
                onerror: null,
                onsuccess: null,
              };
              // Trigger onsuccess immediately
              setTimeout(() => {
                if (mockRequest.onsuccess) {
                  mockRequest.onsuccess({ target: mockRequest });
                }
              }, 0);
              return mockRequest;
            }),
            clear: jest.fn(() => {
              globalStore.clear();
              const mockRequest = {
                onerror: null,
                onsuccess: null,
              };
              // Trigger onsuccess immediately
              setTimeout(() => {
                if (mockRequest.onsuccess) {
                  mockRequest.onsuccess({ target: mockRequest });
                }
              }, 0);
              return mockRequest;
            }),
            openCursor: jest.fn(() => {
              const entries = Array.from(globalStore.entries());
              let currentIndex = 0;

              const mockRequest = {
                onerror: null,
                onsuccess: null,
                result: null as any,
              };

              const triggerSuccess = () => {
                if (currentIndex < entries.length) {
                  // There's a cursor with data
                  mockRequest.result = {
                    key: entries[currentIndex][0],
                    value: entries[currentIndex][1],
                    continue: () => {
                      currentIndex++;
                      // Trigger next onsuccess
                      setTimeout(triggerSuccess, 0);
                    },
                  };
                } else {
                  // No more cursors (end of iteration)
                  mockRequest.result = null;
                }

                // Trigger onsuccess
                setTimeout(() => {
                  if (mockRequest.onsuccess) {
                    mockRequest.onsuccess({ target: mockRequest });
                  }
                }, 0);
              };

              // Start the iteration
              triggerSuccess();
              return mockRequest;
            }),
          })),
        })),
        objectStoreNames: {
          contains: jest.fn(() => false),
        },
        createObjectStore: jest.fn(),
      },
    };

    // Simulate async behavior
    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: request });
      }
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
    }, 0);

    return request;
  }),
};

// Mock global indexedDB
Object.defineProperty(global, "indexedDB", {
  value: mockIndexedDB,
  writable: true,
});

describe("IndexedDB Cache Adapter", () => {
  beforeEach(() => {
    // Clear global store before each test
    globalStore.clear();
  });

  afterAll(() => {
    // Clean up global store
    globalStore.clear();
  });

  // Run standard cache adapter tests
  runCacheAdapterTests({
    name: "IndexedDB",
    createAdapter: config => createIndexedDBCacheAdapter(config, "test-db", "test-store"),
    useFakeTimers: false,
  });
});
