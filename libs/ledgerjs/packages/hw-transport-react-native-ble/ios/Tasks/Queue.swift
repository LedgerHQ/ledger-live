//
//  Queue.swift
//  hw-transport-react-native-ble
//
//  Created by Juan on 07/6/22.
//

import Foundation
import Starscream
import BleTransport

/// A QueueRunner is a convenience wrapper to be able to consume multiple script runners through the BIM
/// interface. This interface allows a consumer to go over multiple app operations (installs/uninstalls) without
/// needing to resolve the scriptrunner url for each one of them (we have it already on Live side, ok, fair enough)
/// while at the same time breaking the dependency with the JS thread, this is the highlight, yes.
class Queue: NSObject  {
    let BIMWebsocketEndpoint: URL
    let BIMPackQueue: URL
    let BIMHealth: URL

    var runner : Runner?                        /// Handler of the current task
    var pendingRequest: URLSessionDataTask?     /// Backend request to unpack a token

    var token: String = ""                      /// Tokenized representation of our queue
    var rawQueue: String = ""                   /// Unresolved queue to fetch a token from
    var index: Int = 0                          /// Current index on the queue
    var item: Item?                             /// Current item we are processing
    var tasks: Tasks = Tasks(tasks: [])         /// Resolved items from the queue token

    var stopped: Bool = false

    public init (
        rawQueue: String,
        endpoint: String
    ) {
        self.rawQueue = rawQueue
        /// This allows us to override the endpoint in case we need to test a new version or staging/prod
        let host = URL(string: endpoint)!.host ?? ""
        self.BIMWebsocketEndpoint = URL(string: "wss://\(host)/ws/channel")!
        self.BIMPackQueue = URL(string: "https://\(host)/queue")!
        self.BIMHealth = URL(string: "https://\(host)/_health")!
        super.init()
        self.resolveTokenFromQueue(true)
    }
    
    /// Exiting the manager or closing an inline installation flow would expect us to cancel any pending installs
    /// When in the LLM main thread paradigm this is easy since the tasks are handled in the same thread as the UI
    /// but here we need to communicate our intent of killing the long running task. This is probably overkill but hey.
    public func stop(_ onStop: @escaping (()->Void)) {
        self.stopped = true
        token = ""
        index = 0
        item = nil
        tasks = Tasks(tasks: [])
        pendingRequest?.cancel()

        if let runner = self.runner {
            runner.stop(onStop)
        } else {
            onStop()
        }
    }
    
    /// This used to be the other way around, JavaScript would give us a resolved token and we would unpack the queue from it
    /// but since the API calls were taking longer than the user took to put the app in the background we were force to move this packing
    /// to the native side. Meaning first we decode the tasks from the raw queue and then we fetch the token from it, a bit backwards
    /// but if it works, it's better that the alternative.
    private func resolveTokenFromQueue(_ autoStart: Bool) {
        let tasks: Tasks?
        do {
            tasks = try JSONDecoder().decode(Tasks.self, from: self.rawQueue.data(using: .utf8)!)
        } catch {
            onEventWrapper(
                RunnerAction.runError,
                withData: ExtraData(message: String(describing:error))
            )
            return
        }
        
        var request = URLRequest(url: BIMPackQueue)
        request.httpMethod = "PUT"
        request.httpBody = self.rawQueue.data(using: .utf8)!

        let session = URLSession.shared
        if let task = self.pendingRequest {
            task.cancel()
        }

        /// Pending error handling if backend is toast.
        self.pendingRequest = session.dataTask(with: request) { [self] (data, response, error) in
            if let error = error, let request = self.pendingRequest {
                if request.progress.isCancelled { return }
                if (error as NSError).code == NSURLErrorCancelled { // We cancelled because a new request was received.
                    return
                }
                onEventWrapper(
                    RunnerAction.runError,
                    withData: ExtraData(message: String(describing:error))
                )
            }
            else if let token = data {
                self.token = String(decoding: token, as: UTF8.self)
                self.tasks = tasks

                if autoStart {
                    self.startRunner()
                }
            }
        }

        self.pendingRequest!.resume()
    }
    

    public func setRawQueue(rawQueue: String) {
        self.rawQueue = rawQueue
        self.index = 0
        self.resolveTokenFromQueue(self.runner == nil)
    }
    
    ///
    ///startRunner
    ///Launch the next Runner and start emitting the events used by the UI
    private func startRunner() -> Void {
        self.item = self.tasks.tasks[self.index]
        if let item = self.item {
            EventEmitter.sharedInstance.dispatch(
                Payload(
                    event: Event.task.rawValue,
                    type: RunnerAction.runStart.rawValue,
                    data: ExtraData(name: item.appName, type: item.operation)
                )
            )

            self.runner = Runner(
                endpoint: BIMWebsocketEndpoint,
                health: BIMHealth,
                onEvent: self.onEventWrapper,
                onDone: self.onDoneWrapper,
                withInitialMessage: "{\"token\":\"\(self.token)\",\"index\":\(self.index)}"
            )
        } /// What if we don't have the item here?
    }
    
    ///
    ///onEventWrapper
    ///The Wrapper is needed to alter the emitted event from a regular runner in case we want to use runners outside of
    ///a Queue context. We are essentially introducing the application name and operation into the event since that's
    ///expected from the UI as part of the multi item logic.
    ///
    ///- Parameter type: RunnerAction.runProgress or RunnerAction.runError
    ///- Parameter withData: Event information to send
    private func onEventWrapper(_ runnerAction: RunnerAction, withData: ExtraData?) -> Void {
        var wrappedData = withData ?? ExtraData()
        if let item = self.item {
            wrappedData.name = item.appName
            wrappedData.type = item.operation
        }

        EventEmitter.sharedInstance.dispatch(
            Payload(
                event: Event.task.rawValue,
                type: runnerAction.rawValue,
                data: wrappedData
            )
        )
    }
    
    ///
    ///onDoneWrapper
    ///
    ///- Parameter disconnectReason : Not sure what I used this for
    ///- Parameter doneMessage : Last message received from the WS before closing a connection, it can mark that we
    ///                          are still processing a queue or that we are done, allowing us to react to it.
    private func onDoneWrapper (disconnectReason: String, doneMessage : String) -> Void {
        if let item = self.item {
            EventEmitter.sharedInstance.dispatch(
                Payload(
                    event: Event.task.rawValue,
                    type: RunnerAction.runSuccess.rawValue,
                    data: ExtraData(name: item.appName, type: item.operation)
                )
            )
            if self.stopped { return }

            if (doneMessage == "CONTINUE") {
                self.index += 1
                self.startRunner()
            } else if (self.index+1 < self.tasks.tasks.count) {
                self.index += 1
                self.startRunner()
                print("Token modified, try to get next one ignoring the HSM message")
            } else {
                self.runner = nil
                EventEmitter.sharedInstance.dispatch(
                    Payload(
                        event: Event.task.rawValue,
                        type: RunnerAction.runComplete.rawValue,
                        data: ExtraData()
                    )
                )
            }
        }
    }
    
    public func onDisconnect(_ code: String, _ message: String, _ error: NSError?) -> Void {
        self.stop({ }) /// Empty because it's a dirty disconenct
        EventEmitter.sharedInstance.dispatch(
            Payload(
                event: Event.task.rawValue,
                type: RunnerAction.runError.rawValue,
                data: ExtraData(code: code, message: message)
            )
        )
    }
}
