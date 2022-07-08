package com.hwtransportreactnativeble.tasks

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.hwtransportreactnativeble.EventEmitter
import com.ledger.live.ble.BleManager
import okhttp3.*
import org.json.JSONObject
import org.json.JSONTokener
import timber.log.Timber
import java.io.IOException
import java.net.URI
import java.net.URL

/**
 * A Queue is a convenience wrapper to be able to consume multiple script runners through the BIM
 * interface. This interface allows a consumer to go over multiple app operations (installs/uninstalls) without
 * needing to resolve the script-runner url for each one of them (we have it already on Live side, ok, fair enough)
 * while at the same time breaking the dependency with the JS thread.
 */
data class Item(val operation: String, val id: Int, val appName: String)

class Queue(
    private var token: String,
    endpoint: String,
    private val eventEmitter: EventEmitter,
    private val bleManager: BleManager,
) {
    private var tag: String = "BleTransport Queue"
    private var index: Int = 0

    private val client = OkHttpClient()
    private var runner: Runner? = null
    private var tasks: ArrayList<Item> = ArrayList()
    private var item: Item? = null

    private val websocketURL: URL
    private val unpackQueueURL: URL

    var isStopped: Boolean = false

    init {
        val uri = URI(endpoint)
        websocketURL = URL("https://${uri.host}/ws/channel")
        unpackQueueURL = URL("https://${uri.host}/unpacked-queue")

        resolveQueueFromToken(true)
    }

    fun setNewToken(newToken: String) {
        token = newToken
        index = 0
        resolveQueueFromToken(runner == null)
    }

    private fun resolveQueueFromToken(autoStart: Boolean = false) {
        for (call in client.dispatcher.queuedCalls()) call.cancel()

        val request = Request.Builder()
            .url(unpackQueueURL)
            .header("X-Bim-Token", token)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                onErrorWrapper(IOException("Network error")) // FIXME, be more precise?
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        onErrorWrapper(IOException("Unexpected code $response"))
                    } else {
                        val body = response.body?.string()
                        try {
                            val jsonResponse = JSONTokener(body).nextValue() as JSONObject
                            val rawTasks = jsonResponse.getJSONArray("tasks")
                            if (rawTasks.length() > 0) {
                                tasks.clear()
                                for (i in 0 until rawTasks.length()) {
                                    val rawItem = rawTasks.getJSONObject(i)
                                    tasks.add(
                                        Item(
                                            id = rawItem.getInt("id"),
                                            operation = rawItem.getString("operation"),
                                            appName = rawItem.getString("appName")
                                        )
                                    )
                                }

                                if (autoStart) {
                                    startRunner()
                                }
                            }
                        } catch (e: Exception) {
                            onErrorWrapper(e)
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
            onStop = ::none
        )
    }
    fun none() {

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

        eventEmitter.dispatch(Arguments.createMap().apply {
            putString("event", "task")
            putString("type", RunnerAction.runSuccess.toString())
            putMap("data", Arguments.createMap().apply {
                putString("name", item.appName)
                putString("type", item.operation)
            })
        })

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

    private fun onErrorWrapper(e: Exception) {
        eventEmitter.dispatch(Arguments.createMap().apply {
            putString("event", "task")
            putString("type", RunnerAction.runError.toString())
            putMap("data", Arguments.createMap().apply {
                putString("message", e.localizedMessage)
            })
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

}
