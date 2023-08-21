export const getStatusMock = () => {
  return JSON.stringify([{ provider: "changelly", swapId: "12345", status: "finished" }]);
};
