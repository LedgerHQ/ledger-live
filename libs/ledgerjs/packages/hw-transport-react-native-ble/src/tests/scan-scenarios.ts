export default [
  [
    "Scanning - Listen for replace events with devices",
    {
      rawGlobalEvents: [
        {
          event: "replace",
          data: {
            devices: [
              {
                id: 123,
                rssi: -123,
                name: "Puerto",
                serviceUUID: [1, 2, 3],
              },
            ],
          },
        },
      ],
      expected: [
        { type: "flush" },
        {
          type: "add",
          descriptor: {
            id: 123,
            rssi: -123,
            name: "Puerto",
            serviceUUID: [1, 2, 3],
          },
        },
      ],
    },
  ],
  [
    "Scanning - Listen for replace events without devices",
    {
      rawGlobalEvents: [
        {
          event: "replace",
          data: {
            devices: [],
          },
        },
      ],
      expected: [{ type: "flush" }],
    },
  ],
];
