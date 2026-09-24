import { createProtocolStateMachine } from "./protocol";
import { QRCodeProtocolError } from "../errors";

describe("qrcode protocol state machine", () => {
  describe("host", () => {
    const handshake = () => {
      const sm = createProtocolStateMachine("host");
      sm.transition("recv", "InitiateHandshake");
      sm.transition("send", "HandshakeChallenge");
      sm.transition("recv", "CompleteHandshakeChallenge");
      sm.transition("send", "HandshakeCompletionSucceeded");
      return sm;
    };

    test("adds the candidate after a complete handshake", () => {
      const sm = handshake();
      expect(sm.getState()).toBe("authenticated");
      sm.transition("recv", "TrustchainShareCredential");
      sm.transition("send", "TrustchainAddedMember");
      expect(sm.isFinished()).toBe(true);
    });

    test("joins the candidate trustchain after a complete handshake", () => {
      const sm = handshake();
      sm.transition("recv", "TrustchainRequestCredential");
      sm.transition("send", "TrustchainShareCredential");
      sm.transition("recv", "TrustchainAddedMember");
      expect(sm.isFinished()).toBe(true);
    });

    test("rejects credentials received before the handshake is initiated", () => {
      const sm = createProtocolStateMachine("host");
      expect(() => sm.transition("recv", "TrustchainShareCredential")).toThrow(QRCodeProtocolError);
    });

    test("rejects credentials received before the digits are verified", () => {
      const sm = createProtocolStateMachine("host");
      sm.transition("recv", "InitiateHandshake");
      sm.transition("send", "HandshakeChallenge");
      expect(() => sm.transition("recv", "TrustchainShareCredential")).toThrow(QRCodeProtocolError);
      expect(sm.isFinished()).toBe(false);
    });

    test("rejects a duplicated InitiateHandshake", () => {
      const sm = createProtocolStateMachine("host");
      sm.transition("recv", "InitiateHandshake");
      expect(() => sm.transition("recv", "InitiateHandshake")).toThrow(QRCodeProtocolError);
    });

    test("rejects a duplicated CompleteHandshakeChallenge", () => {
      const sm = handshake();
      expect(() => sm.transition("recv", "CompleteHandshakeChallenge")).toThrow(
        QRCodeProtocolError,
      );
    });

    test("rejects a message it is supposed to send", () => {
      const sm = createProtocolStateMachine("host");
      sm.transition("recv", "InitiateHandshake");
      expect(() => sm.transition("recv", "HandshakeChallenge")).toThrow(QRCodeProtocolError);
    });

    test("rejects anything received once finished", () => {
      const sm = handshake();
      sm.transition("recv", "TrustchainShareCredential");
      sm.transition("send", "TrustchainAddedMember");
      expect(() => sm.transition("recv", "Failure")).toThrow(QRCodeProtocolError);
    });
  });

  describe("candidate", () => {
    const handshake = () => {
      const sm = createProtocolStateMachine("candidate");
      sm.transition("send", "InitiateHandshake");
      sm.transition("recv", "HandshakeChallenge");
      sm.transition("send", "CompleteHandshakeChallenge");
      sm.transition("recv", "HandshakeCompletionSucceeded");
      return sm;
    };

    test("shares its credentials after a complete handshake", () => {
      const sm = handshake();
      sm.transition("send", "TrustchainShareCredential");
      sm.transition("recv", "TrustchainAddedMember");
      expect(sm.isFinished()).toBe(true);
    });

    test("adds the host after a complete handshake", () => {
      const sm = handshake();
      sm.transition("send", "TrustchainRequestCredential");
      sm.transition("recv", "TrustchainShareCredential");
      sm.transition("send", "TrustchainAddedMember");
      expect(sm.isFinished()).toBe(true);
    });

    test("rejects credentials received before the digits are verified", () => {
      const sm = createProtocolStateMachine("candidate");
      sm.transition("send", "InitiateHandshake");
      expect(() => sm.transition("recv", "TrustchainShareCredential")).toThrow(QRCodeProtocolError);
    });

    test("rejects a trustchain received before the digits are verified", () => {
      const sm = createProtocolStateMachine("candidate");
      sm.transition("send", "InitiateHandshake");
      expect(() => sm.transition("recv", "TrustchainAddedMember")).toThrow(QRCodeProtocolError);
    });

    test("rejects a duplicated CompleteHandshakeChallenge", () => {
      const sm = createProtocolStateMachine("candidate");
      sm.transition("send", "InitiateHandshake");
      sm.transition("recv", "HandshakeChallenge");
      sm.transition("send", "CompleteHandshakeChallenge");
      expect(() => sm.transition("send", "CompleteHandshakeChallenge")).toThrow(
        QRCodeProtocolError,
      );
    });

    test("rejects a duplicated HandshakeChallenge", () => {
      const sm = createProtocolStateMachine("candidate");
      sm.transition("send", "InitiateHandshake");
      sm.transition("recv", "HandshakeChallenge");
      sm.transition("send", "CompleteHandshakeChallenge");
      expect(() => sm.transition("recv", "HandshakeChallenge")).toThrow(QRCodeProtocolError);
    });

    test("ends the session on a Failure answering the digits", () => {
      const sm = handshake();
      sm.transition("recv", "Failure");
      expect(sm.isFinished()).toBe(true);
    });

    test("rejects a Failure received before the digits are answered", () => {
      const sm = createProtocolStateMachine("candidate");
      sm.transition("send", "InitiateHandshake");
      expect(() => sm.transition("recv", "Failure")).toThrow(QRCodeProtocolError);
      sm.transition("recv", "HandshakeChallenge");
      expect(() => sm.transition("recv", "Failure")).toThrow(QRCodeProtocolError);
    });

    test("ends the session on a Failure rejecting the digits", () => {
      const sm = createProtocolStateMachine("candidate");
      sm.transition("send", "InitiateHandshake");
      sm.transition("recv", "HandshakeChallenge");
      sm.transition("send", "CompleteHandshakeChallenge");
      sm.transition("recv", "Failure");
      expect(sm.isFinished()).toBe(true);
    });
  });

  describe("peer binding", () => {
    test("accepts every message of the bound peer", () => {
      const sm = createProtocolStateMachine("host");
      sm.bindPeer("AABB");
      expect(() => sm.bindPeer("aabb")).not.toThrow();
    });

    test("rejects a message from another peer", () => {
      const sm = createProtocolStateMachine("host");
      sm.bindPeer("aabb");
      expect(() => sm.bindPeer("ccdd")).toThrow(QRCodeProtocolError);
    });
  });
});
