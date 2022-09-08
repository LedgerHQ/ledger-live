package com.hwtransportreactnativeble

import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import timber.log.Timber
import java.lang.Long.max
import java.util.*
import kotlin.concurrent.timerTask


class EventEmitter private constructor
    (
    private val context: ReactContext
) {
    private val tag: String = "BleTransport EventEmitter"
    private var isConsumingQueue: Boolean = false
    private var isJavaScriptAvailable: Boolean = true
    private val msOffset: Long = 1200

    private var queuedEvents: ArrayList<WritableMap> = ArrayList()
    private var pendingEvent: Timer? = null
    private var pendingEventScheduledTime: Long = -1

    private var lastEventType: String = ""
    private var lastEventTime: Long = -1


    fun onAppStateChange(awake: Boolean) {
        isJavaScriptAvailable = awake

        if (awake) {
            consumeEventQueue()
        }
    }

    fun dispatch(payload: WritableMap) {
        // Events that share the same type and event can be replaced with the latest.
        if (queuedEvents.isNotEmpty()) {
            val previousLog = queuedEvents.last()
            if (
                previousLog.getString("type").equals(payload.getString("type"))
                && previousLog.getString("event").equals(payload.getString("event"))
            ) {
                Timber.d("$tag replacing queued event")
                queuedEvents[queuedEvents.count() - 1] = payload
                consumeEventQueue()
                return
            }
        }
        Timber.d("$tag adding event to queue")
        queuedEvents.add(payload)
        consumeEventQueue()
    }

    private fun consumeEventQueue() {
        if (!isJavaScriptAvailable || isConsumingQueue) {
            Timber.d("$tag Already consuming or JS unavailable")
            return
        }

        isConsumingQueue = true
        while (queuedEvents.isNotEmpty() && isJavaScriptAvailable) {
            val event = queuedEvents.removeFirst()

            val lambdaExec: (event: WritableMap) -> Unit = {
                // Actually emit the event
                Timber.d("$tag emitting event ($it)")
                context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("BleTransport", it)

                // Cleanup
                lastEventType = it.getString("type").toString()
                lastEventTime = System.currentTimeMillis()

                pendingEvent?.cancel()
                pendingEvent = null
            }

            val currentTime = System.currentTimeMillis()
            if (pendingEvent != null && lastEventType == event.getString("type")) {
                Timber.d("$tag Cancel the scheduled task, schedule a new one with the new lambda")
                pendingEvent?.cancel()
                pendingEvent = Timer().apply {
                    schedule(
                        timerTask() { lambdaExec(event) },
                        max(pendingEventScheduledTime - currentTime, 0)
                    )
                }
                // No need to update the pendingSchedule since we reused it
            } else if (lastEventTime + msOffset >= currentTime && lastEventType == event.getString("type")) {
                Timber.d("$tag Scheduling the event, it's too soon")
                pendingEvent = Timer().apply {
                    schedule(
                        timerTask() { lambdaExec(event) },
                        msOffset
                    )
                }
                pendingEventScheduledTime = System.currentTimeMillis() + msOffset
            } else {
                // It's a different type, or it's been long enough
                lambdaExec(event)
            }
        }
        // Yummy!
        isConsumingQueue = false
    }

    companion object {
        @Volatile
        private var INSTANCE: EventEmitter? = null
        fun getInstance(context: ReactContext): EventEmitter = synchronized(this) {
            return INSTANCE ?: EventEmitter(context).also { INSTANCE = it }
        }
    }

}
