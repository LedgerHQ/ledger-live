interface CosmosEventMessage {
  type: string;
  [key: string]: any;
}

export const getMainMessage = (messages: CosmosEventMessage[]): CosmosEventMessage => {
  const messagePriorities: string[] = [
    "MsgUndelegate",
    "MsgBeginRedelegate",
    "MsgDelegate",
    "MsgWithdrawDelegatorReward",
    "MsgTransfer",
    "MsgRecvPacket",
    "MsgSend",
  ];
  const sortedTypes = messages
    .filter(m => messagePriorities.includes(m.type))
    .sort((a, b) => messagePriorities.indexOf(a.type) - messagePriorities.indexOf(b.type));
  return sortedTypes[0];
};
