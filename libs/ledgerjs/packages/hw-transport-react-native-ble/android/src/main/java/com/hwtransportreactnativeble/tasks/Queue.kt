package com.hwtransportreactnativeble.tasks

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.hwtransportreactnativeble.EventEmitter
import com.ledger.live.ble.BleManager
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.json.JSONTokener
import timber.log.Timber
import java.io.IOException
import java.net.URI
import java.net.URL


val JSON = "application/json; charset=utf-8".toMediaTypeOrNull()
/**
 * A Queue is a convenience wrapper to be able to consume multiple script runners through the BIM
 * interface. This interface allows a consumer to go over multiple app operations (installs/uninstalls) without
 * needing to resolve the script-runner url for each one of them (we have it already on Live side, ok, fair enough)
 * while at the same time breaking the dependency with the JS thread.
 */
data class Item(val operation: String, val id: Int, val appName: String)

class Queue(
    private var rawQueue: String,
    endpoint: String,
    private val eventEmitter: EventEmitter,
    private val bleManager: BleManager,
) {
    private val tag: String = "BleTransport Queue"
    private var index: Int = 0
    private var token: String? = null

    private val client = OkHttpClient()
    private var runner: Runner? = null
    private val tasks: ArrayList<Item> = ArrayList()
    private var item: Item? = null

    private val websocketURL: URL
    private val packQueueURL: URL

    var isStopped: Boolean = false

    init {
        val uri = URI(endpoint)
        websocketURL = URL("https://${uri.host}/ws/channel")
        packQueueURL = URL("https://${uri.host}/queue")

        resolveTokenFromQueue(true)
    }

    fun setRawQueue(newRawQueue: String) {
        rawQueue = newRawQueue
        index = 0
        resolveTokenFromQueue(runner == null)
    }

    /// This used to be the other way around, JavaScript would give us a resolved token and we would unpack the queue from it
    /// but since the API calls were taking longer than the user took to put the app in the background we were force to move this packing
    /// to the native side. Meaning first we decode the tasks from the raw queue and then we fetch the token from it, a bit backwards
    /// but if it works, it's better that the alternative.
    private fun resolveTokenFromQueue(autoStart: Boolean = false) {
        val newTasks: ArrayList<Item> = ArrayList()
        try {
            val jsonResponse = JSONTokener(rawQueue).nextValue() as JSONObject
            val rawTasks = jsonResponse.getJSONArray("tasks")
            for (i in 0 until rawTasks.length()) {
                val rawItem = rawTasks.getJSONObject(i)
                newTasks.add(
                    Item(
                        id = rawItem.getInt("id"),
                        operation = rawItem.getString("operation"),
                        appName = rawItem.getString("appName")
                    )
                )
            }
        } catch (e: Exception) {
            onErrorWrapper(e)
            return
        }

        client.dispatcher.queuedCalls().forEach { it.cancel() }
        val body: RequestBody = rawQueue.toRequestBody(JSON)

        val request = Request.Builder()
            .url(packQueueURL)
            .method("PUT", body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                onErrorWrapper(IOException("Network error", e))
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        onErrorWrapper(IOException("Unexpected code $response"))
                    } else {
                        token = response.body?.string()
                        tasks.clear()
                        tasks.addAll(newTasks)

                        if (autoStart) {
                            startRunner()
                        }
                    }

                }
            }
        })
    }

    private fun startRunner() {
        if (index >= tasks.size) return
        val item = tasks[index]
        Timber.d("Starting runner for ${item.toString()}")

        eventEmitter.dispatch(Arguments.createMap().apply {
            putString("event", "task")
            putString("type", RunnerAction.runStart.toString())
            putMap("data", Arguments.createMap().apply {
                putString("name", item.appName)
                putString("type", item.operation)
            })
        })

        runner = Runner(
            endpoint = websocketURL,
            initialMessage = "{\"token\":\"$token\",\"index\":$index}",
            bleManager = bleManager,

            onDone = ::onDoneWrapper,
            onEvent = ::onEventWrapper,
            onStop = ::onStopWrapper
        )
    }
    private fun onStopWrapper() {
        Timber.d("Runner stopped for ${item.toString()}")
    }

    fun stop() {
        isStopped = true
        token = ""
        index = 0
        item = null
        tasks.clear()
        for (call in client.dispatcher.queuedCalls()) call.cancel()

        runner?.stop()
        runner = null
    }

    private fun onDoneWrapper(doneMessage: String) {
        if (index >= tasks.size) return
        val item = tasks[index]
        Timber.d("Completed runner for ${item.toString()}")
        onEventWrapper(RunnerAction.runSuccess, Arguments.createMap().apply {})

        if (isStopped) return

        if (doneMessage == "CONTINUE") {
            index++
            startRunner()
        } else if (index + 1 < tasks.size) {
            Timber.d("Queueing next runner regardless of doneMessage (token change)")
            index++
            startRunner()
        } else {
            stop()

            eventEmitter.dispatch(Arguments.createMap().apply {
                putString("event", "task")
                putString("type", RunnerAction.runComplete.toString())
            })
        }
    }

    fun onErrorWrapper(e: Exception) {
        eventEmitter.dispatch(Arguments.createMap().apply {
            putString("event", "task")
            putString("type", RunnerAction.runError.toString())
            putMap("data", Arguments.createMap().apply {
                putString("code", e.localizedMessage)
                putString("message", e.localizedMessage)
            },)
        })
    }

    private fun onEventWrapper(action: RunnerAction, data: WritableMap) {
        if (index >= tasks.size) return
        val item = tasks[index]
        Timber.d("Event for ${item.toString()}")

        data.putString("name", item.appName)
        data.putString("type", item.operation)

        eventEmitter.dispatch(Arguments.createMap().apply {
            putString("event", "task")
            putString("type", action.toString())
            putMap("data", data)
        })
    }

    fun onDisconnect(reason: String) {
        Timber.d("$tag disconnect error")
        eventEmitter.dispatch(Arguments.createMap().apply {
            putString("event", "task")
            putString("type", RunnerAction.runError.toString())
            putMap("data", Arguments.createMap().apply {
                putString("code", reason)
                putString("message", reason)
            })
        })
    }
}
