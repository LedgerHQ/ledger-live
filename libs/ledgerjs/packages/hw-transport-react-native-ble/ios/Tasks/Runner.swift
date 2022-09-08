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
    let scriptRunnerOK = ["CONTINUE", "TERMINATE"]
    let scriptRunnerKO = ["CANCELLED",
                          "SR DISCONNECTION",
                          "INDEX OUT OF BOUNDS",
                          "NOT CONNECTED TO SCRIPT RUNNER"]
    
    var scriptRunnerURL : URL
    var healthCheckURL : URL?
    var initialMessage: String = ""                             /// First message to send upon connecting to the script runner.
    
    var socket: WebSocket?                                      /// Connection to the scriptrunner
    var pendingRequest: URLSessionDataTask?                     /// Backend request for network down
    
    var onEmit: ((RunnerAction, ExtraData?)->Void)?
    var onDone: ((String)->Void)?
    
    
    var isRunning: Bool = false                                 /// Is the Runner _running_
    var isInBulkMode: Bool = false                              /// Are we exchanging a bulk payload or individual messages
    var isPendingOnDone: Bool = false                           /// Scriptrunner connection is closed, but we haven't finished the exchange?
    
    
    var backgroundTaskID: UIBackgroundTaskIdentifier?           /// iOS identifier for a background network connection in this case
    
    var HSMNonce: Int = 0                                       /// HSM uses this nonce to know which frame we are replying to
    var APDUMaxCount: Int = 0                                   /// Total number of APDUS from a bulk message, used for % calculation
    var APDUQueue: [APDU] = []                                  /// Pending APDU array to send to the device
    
    
    var lastBLEResponse: String = ""                            /// Last received APDU from the device
    var lastScriptRunnerMessage: String = ""                    /// Last message from the SR, this allows us to know whether to connect again, or complete.
    
    
    
    /**
     Constructor for the Runner class.
     - Parameter endpoint:  The URL of the scriptrunner we will consume with this Runner.
     - Parameter health:    The URL of the health endpoint used to check if the backend is alive and ready for us.
     - Parameter onEvent:   Callback to trigger the emision of events that will either be queued or bridged to the JavaScript side.
     - Parameter onDone:    Callback to trigger when we have completed the exchange with the scriptrunner.
     */
    public init (
        endpoint : URL,
        health: URL?,
        onEvent: @escaping ((RunnerAction, ExtraData?)->Void),
        onDone: ((String)->Void)?
    ) {
        self.scriptRunnerURL = endpoint
        self.healthCheckURL = health
        self.onEmit = onEvent
        self.onDone = onDone
        
        super.init()
        self.startBackgroundTask()
        self.startScriptRunner()
    }
    
    convenience init (
        endpoint : URL,
        health: URL,
        onEvent: @escaping ((RunnerAction, ExtraData?)->Void),
        onDone: ((String)->Void)?,
        withInitialMessage: String
    ) {
        self.init(endpoint: endpoint, health: health, onEvent: onEvent, onDone: onDone)
        self.initialMessage = withInitialMessage
    }
    
    
    /**
     Used for cleaning up if we end up in a bad state higher up the chain, for instance if we receive a disconnect request
     from the transport itself we can't just continue to try to consume the scriptrunner. A disconnect is a disconnect afterall
     and we need to honor it
     - Parameter onStop: A callback to invoke after the completion of the socket disconnection
     */
    public func stop(_ onStop: @escaping (()->Void)) {
        self.isRunning = false
        socket?.disconnect()
        onStop();
    }
    
    /**
     Request to begin a new background task, this is essentially asking iOS to allow us to communicate over the network
     even when the application is in the background. Without this, after the completion of one or two runners, a parent queue
     would lose the ability to connect to the network, resulting in incomplete installations. This may not be enough either /!\
     */
    func startBackgroundTask() {
        self.backgroundTaskID = UIApplication.shared.beginBackgroundTask (withName: "Runner"){ self.endBackgroundTask()}
    }
    
    /**
     Notify that our background task has completed. We should probably add some cleanup code to run over there in case
     we get terminated before we do all we need. Perhaps adding some reconciliation code on the JavaScript side would be
     enough.
     */
    func endBackgroundTask() {
        // End the task assertion.
        UIApplication.shared.endBackgroundTask(self.backgroundTaskID!)
        self.backgroundTaskID = UIBackgroundTaskIdentifier.invalid
    }
    
    /**
     Convenience method used to  encapsulate all the needed actions to perform when we fail a script runner interaction.
     We can fail due to network issues, but also due to dropped connectivity on the BLE front, or not valid responses from
     the runner side. This a bit catch-all fail callback
     - Parameter code: Used on the live side for error mapping from a string to a known error type.
     - Parameter message: Raw error message, used for logging and to not miss traces from the JavaScript side.
     - Returns: Void
     **/
    private func onFailedScriptRunner(_ code: TransportError, _ message: String?) -> Void {
        onEmit!(
            RunnerAction.runError,
            ExtraData(code: code.rawValue, message: message)
        )
        self.pendingRequest?.cancel()
        self.endBackgroundTask()
        self.stop(){
            print("BIM runner failed.")
        }
    }
    
    /**
     Wrapper before we do any attempt at communicating with the BIM backend. We hit the Health endpoint and only after
     we acknowledge it's working as expected do we attempt to connect via the websocket protocol to consume a scriptrunner
     - Parameter onSuccess
     - Parameter onError
     */
    private func withBIM(_ onSuccess: @escaping () -> Void, onError: @escaping (_ error: Error?) -> Void) {
        if let healthCheckURL = self.healthCheckURL {
            var request = URLRequest(url: healthCheckURL)
            request.httpMethod = "GET"
            if let task = self.pendingRequest {
                task.cancel()
            }
            
            let session = URLSession.shared
            self.pendingRequest = session.dataTask(with: request) { (_, response, error) -> Void in
                guard error == nil else {
                    onError(error)
                    self.endBackgroundTask()
                    return
                }
                onSuccess()
            }
            self.pendingRequest!.resume()
        } else {
            onSuccess() /// Bypass the health check if no URL was provided
        }
    }
    
    private func startScriptRunner() -> Void {
        self.isRunning = true
        withBIM(){ [self] in
            var request = URLRequest(url: scriptRunnerURL)
            request.timeoutInterval = 30 // No idea if we need this much
            socket = WebSocket(request: request)
            
            print("BIM opening \(self.scriptRunnerURL)")
            socket!.connect()
            socket!.onEvent = { [self] event in
                switch event {
                case .connected(_):
                    /// In the case of BIM, we should initiate the message exchange
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
                        onDone!(lastScriptRunnerMessage)
                    } else {
                        isPendingOnDone = true
                    }
                    break
                case .text(let message):
                    lastScriptRunnerMessage = message
                    let data = Data(message.utf8)
                    
                    /// If it's a known end message, handle it.
                    if scriptRunnerOK.contains(message) { return }
                    else if scriptRunnerKO.contains(message) {
                        self.onFailedScriptRunner(.unknownError, message)
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
                                APDUMaxCount = rawAPDUs.count /// Used for percentage reports
                                
                                for rawAPDU in rawAPDUs {
                                    APDUQueue.append(APDU(raw: rawAPDU));
                                }
                            } else {
                                isInBulkMode = false
                                APDUQueue = [APDU(raw: json["data"] as? String ?? "")]
                                HSMNonce = json["nonce"] as? Int ?? 0;
                            }
                            // Trigger a disconnect too
                            isPendingOnDone = true
                            handleNextAPDU();
                        }
                    } catch {
                        self.onFailedScriptRunner(.networkDown, error.localizedDescription)
                    }
                    break
                case .error(let error):
                    self.onFailedScriptRunner(.networkDown, error?.localizedDescription)
                    break
                case .viabilityChanged(let isChanged):
                    if !isChanged {
                        self.onFailedScriptRunner(.networkDown, "")
                    }
                    break
                default:
                    print("BIM ws \(event)")
                    break
                }
            }
        } onError: { [self] error in
            self.onFailedScriptRunner(.networkDown, error?.localizedDescription)
        }
    }
    
    /**
     For as long as we have APDU entries in the APDUQueue, attempt to send the next one to the device. This can either
     happen due to a successful response from the device coming from onDeviceResponse or from a message from the
     scriptrunner.
     */
    func handleNextAPDU() -> Void {
        if !self.APDUQueue.isEmpty {
            let apdu = self.APDUQueue.removeFirst()
            BleTransport.shared.exchange(apdu: apdu, callback: self.onDeviceResponse)
        } else if self.isPendingOnDone {
            self.onDone!(self.lastScriptRunnerMessage)
        }
    }
    
    /**
     Callback for the result of an exchange with a device.
     - Parameter result: Either a success string, containing the response or a BleTransportError
     */
    func onDeviceResponse(_ result : Result<String, BleTransportError>) {
        switch result {
        case .success(let response):
            let data = response.dropLast(4)
            
            if self.isInBulkMode {
                let index = self.APDUMaxCount - self.APDUQueue.count
                let progress = ((Double(index))/Double(self.APDUMaxCount))
                self.onEmit!(
                    RunnerAction.runProgress,
                    ExtraData(progress: progress, index: index, total: self.APDUMaxCount)
                )
                self.handleNextAPDU()
            } else {
                /// Send message back to the scriptrunner
                let response = "{\"nonce\":\(self.HSMNonce),\"response\":\"success\",\"data\":\"\(data)\"}"
                print("BIM -> \(response)")
                self.socket!.write(string: response)
            }
        case .failure(let error):
            self.onFailedScriptRunner(.cantOpenDevice, error.localizedDescription)
        }
    }
}
