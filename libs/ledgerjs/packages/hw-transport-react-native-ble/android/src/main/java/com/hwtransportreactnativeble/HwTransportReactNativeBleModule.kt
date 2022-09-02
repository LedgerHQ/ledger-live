package com.hwtransportreactnativeble

import com.facebook.react.bridge.*
import com.hwtransportreactnativeble.tasks.Queue
import com.ledger.live.ble.BleManagerFactory
import timber.log.Timber
import java.util.*
import kotlin.concurrent.timerTask


class HwTransportReactNativeBleModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    private var tag: String = "BleTransport"
    private var onDisconnect: ((Any) -> Void)? = null
    private var retriesLeft = 1
    private var bleManager = BleManagerFactory.newInstance(reactContext)
    private var eventEmitter = EventEmitter.getInstance(reactContext)
    private var queue: Queue? = null
    private var planted: Boolean = false

    override fun getName(): String {
        return "HwTransportReactNativeBle"
    }

    private fun onDisconnectWrapper(any: String) {
        onDisconnect?.let { it(any) }
    }

    init {
        Timber.plant(Timber.DebugTree())
        Timber.d("init ble native module $this")
    }

    @ReactMethod
    fun observeBluetooth() {
        // if (!planted) {
        //     Timber.plant(Timber.DebugTree())
        //     planted = true
        // }
    }

    @ReactMethod
    fun listen(promise: Promise) {
        Timber.d("$tag: \t start scanning")
        bleManager.startScanning {
            val devices = Arguments.createArray()
            for (device in it) {
                devices.pushMap(Arguments.createMap().apply {
                    putString("id", device.id)
                    putString("name", device.name)
                    putString("rssi", device.rssi.toString())
                    putArray("serviceUUIDs", Arguments.createArray().apply{pushString(device.serviceId)})
                })
            }
            // We hit this callback whenever a device is seen or goes away, this means we effectively
            // replace the list instead of emitting new events one by one. This solves the
            val event = Arguments.createMap().apply {
                putString("event", "replace")
                putString("type", "replace")
                putMap("data", Arguments.createMap().apply {
                    putArray("devices", devices)
                })
            }
            eventEmitter.dispatch(event)
        }
        promise.resolve(1)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Set up any upstream listeners or background tasks as necessary
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Remove upstream listeners, stop unnecessary background tasks
    }

    @ReactMethod
    fun stop(promise: Promise) {
        Timber.d("$tag: \t stop scanning")
        bleManager.stopScanning()
        promise.resolve(1)
    }

    @ReactMethod
    fun connect(uuid: String, promise: Promise) {
        Timber.d("$tag: \t Attempt to connect to $uuid")
        var consumed = false
        bleManager.connect(
            address = uuid,
            onConnectSuccess = {
                retriesLeft = 1
                Timber.d("$tag: \t connection success")
                if (!consumed) {
                    promise.resolve(it.id)
                    consumed = true
                } else {
                    print("already consumed")
                }
            },
            onConnectError = {
                if (it === "Device connection lost") {
                    // We shouldn't have `Device connection lost` here, we should only get a failure
                    // to connect.
                    Timber.d("$tag: \t connection failure ignored, trying again")
                    if (retriesLeft > 0) {
                        connect(uuid, promise)
                    }
                } else if (!consumed) {
                    Timber.d("$tag: \t connection failure")
                    promise.reject("connectError", Exception(it))
                    consumed = true
                } else {
                    print("already consumed")
                }
            })
    }

    @ReactMethod
    fun onAppStateChange(awake: Boolean) {
        Timber.d("$tag: \t onAppStateChange triggered")
        eventEmitter.onAppStateChange(awake)
    }

    private var pendingEvent: Timer? = null
    @ReactMethod
    fun disconnect(promise: Promise) {
        /// Prevent race condition between organic disconnect (allow open app) and explicit disconnection below.
        pendingEvent = Timer()
        pendingEvent!!.schedule(
            timerTask() {
                queue?.stop()
                if (!bleManager.isConnected) {
                    promise.resolve(true)
                } else {
                    bleManager.disconnect {
                        Timber.d("$tag: \t disconnected")
                        promise.resolve(true)
                    }
                }
            },
            3000,
        )
    }

    @ReactMethod
    fun exchange(apdu: String, promise: Promise) {
        Timber.d("$tag: APDU -> $apdu")
        if (!bleManager.isConnected) {
            promise.reject("Device disconnected", Exception("Device disconnected"))
            return
        }
        bleManager.send(
            apduHex = apdu,
            onSuccess = {
                Timber.d("$tag: APDU <- $it")
                onDisconnect = null
                promise.resolve(it.replace(", ", ""))
            },
            onError = {
                Timber.d("$tag: APDU ERROR $it")
                onDisconnectWrapper(it)
            }
        )
    }

    @ReactMethod
    fun isConnected(promise: Promise) {
        Timber.d("$tag: \t isConnected ${bleManager.isConnected}")
        promise.resolve(bleManager.isConnected)
    }

    @ReactMethod
    fun queue(rawQueue: String, endpoint: String){
        if (queue != null && !queue!!.isStopped) {
            Timber.d("$tag: \t replacing rawQueue $rawQueue")
            queue!!.setRawQueue(rawQueue)
            return
        }
        Timber.d("$tag: \t starting new queue $rawQueue")

        queue = Queue(rawQueue, endpoint, eventEmitter, bleManager)
    }
}

