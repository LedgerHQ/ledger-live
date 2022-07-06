//
//  Runner.swift
//  hw-transport-react-native-ble
//
//  Created by Juan on 28/5/22.
//

import Foundation
import Starscream
import BleTransport

class Runner: NSObject  {
    var endpoint : URL
    var health : URL
    var pendingRequest: URLSessionDataTask?     /// Backend request for network down
    
    var onEmit: ((RunnerAction, ExtraData?)->Void)?
    var onDone: ((String, String)->Void)?
    var onStop: (()->Void)?
    var initialMessage: String = ""
    
    var isRunning: Bool = false
    var isUserBlocked: Bool = false
    var isInBulkMode: Bool = false
    var pendingOnDone: Bool = false
    var socket: WebSocket?
    
    var HSMNonce: Int = 0               /// HSM uses this nonce to know which frame we are replying to
    var APDUMaxCount: Int = 0
    var APDUQueue: [APDU] = []
    var lastBLEResponse: String = ""
    var lastScriptRunnerMessage: String = ""

    var stopped: Bool = false

    public func setURL(_ url : URL) {
        self.endpoint = url
    }

    convenience init (
        endpoint : URL,
        health: URL,
        onEvent: @escaping ((RunnerAction, ExtraData?)->Void),
        onDone: ((String, String)->Void)?,
        withInitialMessage: String
    ) {
        self.init(endpoint: endpoint, health: health, onEvent: onEvent, onDone: onDone)
        self.initialMessage = withInitialMessage
    }
    
    public init (
        endpoint : URL,
        health: URL,
        onEvent: @escaping ((RunnerAction, ExtraData?)->Void),
        onDone: ((String, String)->Void)?
    ) {
        self.endpoint = endpoint
        self.health = health
        self.isRunning = true
        self.onEmit = onEvent
        self.onDone = onDone
        
        super.init()
        self.startScriptRunner()
    }
    
    
    public func stop(_ onStop: @escaping (()->Void)) {
        self.stopped = true
        socket?.disconnect()
        onStop();
    }
    
    /// Based on the apdu in/out we could infer some events that we need to emit up to javascript. Not all exchanges need an event.
    private func onEventFromAPDU(_ apdu : String, fromHSM: Bool = true) {
        if self.isInBulkMode {
            let progress = ((Double(self.APDUMaxCount-self.APDUQueue.count))/Double(self.APDUMaxCount))
            self.onEmit!(
                RunnerAction.runProgress,
                ExtraData(progress: progress)
            )
        }
    }
    
    /// This will detect global network down too but the main focus was to detect a dead bim server.
    private func withBIM(_ callback: @escaping () -> Void, errorCallback: @escaping (_ error: Error?) -> Void) {
        var request = URLRequest(url: self.health)
        request.httpMethod = "GET"
        if let task = self.pendingRequest {
            task.cancel()
        }
        
        let session = URLSession.shared
        self.pendingRequest = session.dataTask(with: request) { (_, response, error) -> Void in
            guard error == nil else {
              errorCallback(error)
              return
            }
            callback()
        }
        self.pendingRequest!.resume()
    }
    
    private func startScriptRunner() -> Void {
        withBIM(){ [self] in
            var request = URLRequest(url: endpoint)
            request.timeoutInterval = 60 // No idea if we need this much
            
            socket = WebSocket(request: request)
            print("BIM opening \(self.endpoint)")
            socket!.connect()
            socket!.onEvent = { [self] event in
                switch event {
                case .connected(_):
                    // In the case of BIM, we should initiate the message exchange
                    if initialMessage != "" {
                        print("BIM -> \(initialMessage)")
                        socket!.write(string: initialMessage)
                    }
                    break
                case .disconnected(let reason, _):
                    /// We need to communicate this **only** when have finished the device exchange.
                    /// Never forget that we are a bridge between a backend and the device and even though
                    /// the communication with the backend may over, we may very well still be communicating
                    /// with the device.
                    if !isInBulkMode {
                        onDone!(reason, lastScriptRunnerMessage)
                    } else {
                        pendingOnDone = true
                    }
                    break
                case .text(let message):
                    lastScriptRunnerMessage = message
                    // Receive a message from the scriptrunner
                    let data = Data(message.utf8)

                    if ["CONTINUE", "TERMINATE"].contains(message) { return } /// OK cases
                    else if[                                                  /// KO cases
                        "CANCELLED",
                        "SR DISCONNECTION",
                        "INDEX OUT OF BOUNDS",
                        "NOT CONNECTED TO SCRIPT RUNNER"
                    ].contains(message) {
                        onEmit!(
                            RunnerAction.runError,
                            ExtraData(message: message)
                        )
                        return
                    }

                    do {
                        if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
                            print("BIM <- \(json)")
                            let query = json["query"] as? String;
                            if (query == "bulk") {
                                let rawAPDUs = json["data"] as? [String] ?? []
                                APDUQueue = []
                                isInBulkMode = true
                                APDUMaxCount = rawAPDUs.count // Used for percentage reports
                                
                                for rawAPDU in rawAPDUs {
                                    APDUQueue.append(APDU(raw: rawAPDU));
                                }
                            } else {
                                isInBulkMode = false
                                APDUQueue = [APDU(raw: json["data"] as? String ?? "")]
                                HSMNonce = json["nonce"] as? Int ?? 0;
                            }
                            handleNextAPDU();
                        }
                    } catch {
                        onEmit!(
                            RunnerAction.runError,
                            ExtraData(message: error.localizedDescription)
                        )
                    }
                    break
                default:
                    print("BIM ws \(event)")
                    break
                }
            }
        } errorCallback: { [self] error in
            onEmit!(
                RunnerAction.runError,
                ExtraData(message: TransportError.networkDown.rawValue)
            )
        }
    }
    
    func handleNextAPDU() -> Void {
        if let onStop = self.onStop {
            /// We have been stopped mid bulk exchange, send a cleanup apdu to get out of it.
            /// This apdu is an 'openApp' command with a white space as the app name, this causes a 6870
            /// response, we follow that with a getAppAndVersion apdu which also fails. Then we can disconnect.
            if self.APDUQueue.count > 0 {
                let apdu = self.APDUQueue.removeFirst()
                self.onEventFromAPDU((apdu.data.hexEncodedString()))
                BleTransport.shared.exchange(apdu: apdu) { _ in
                    self.handleNextAPDU()
                }
            } else {
                onStop()
            }
        } else if !self.APDUQueue.isEmpty {
            let apdu = self.APDUQueue.removeFirst()
            self.onEventFromAPDU((apdu.data.hexEncodedString()))
            BleTransport.shared.exchange(apdu: apdu, callback: self.onDeviceResponse)
        } else if self.pendingOnDone {
            /// We don't have pending apdus, and we have gone past a bulk payload, we can emit the disconnect
            self.onDone!("reason", self.lastScriptRunnerMessage) // TODO not quite right
        }
    }
    
    func onDeviceResponse(_ result : Result<String, BleTransportError>) {
        switch result {
        case .success(let response):
            let data = response.dropLast(4)
            
            self.onEventFromAPDU(response, fromHSM: false)
            if (self.isInBulkMode) {
                self.handleNextAPDU()
            } else {
                // Send message back to the script runner
                // Probably a good idea to move this to an encoded string
                let response = "{\"nonce\":\(self.HSMNonce),\"response\":\"success\",\"data\":\"\(data)\"}"
                print("BIM -> \(response)")
                self.socket!.write(string: response)
            }
        case .failure(let error):
            onEmit!(
                RunnerAction.runError,
                ExtraData(message: error.localizedDescription)
            )
        }
    }
}
