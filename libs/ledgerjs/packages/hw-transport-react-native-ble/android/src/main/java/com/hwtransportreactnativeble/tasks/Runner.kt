package com.hwtransportreactnativeble.tasks

import androidx.core.os.bundleOf
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.ledger.live.ble.BleManager
import okhttp3.*
import org.json.JSONObject
import org.json.JSONTokener
import timber.log.Timber
import java.net.URL
import kotlin.collections.ArrayList

/**
 * A runner is in charge of opening a connection with a script-runner and acting as a proxy
 * between the device and the HSM. We will regularly emit events through EventEmitter back
 * to the JavaScript thread in order to reconcile the UI with what's happening here.
 */
enum class RunnerAction {
    runStart,
    runProgress,
    runSuccess,
    runComplete,
    runError,
}

class Runner(
    endpoint: URL,
    private val initialMessage: String = "",
    private var bleManager: BleManager,

    val onDone: (lastMessage: String) -> Unit,
    val onEvent: (action: RunnerAction, data: WritableMap) -> Unit,
    val onStop: () -> Unit,
) : WebSocketListener() {
    private val tag: String = "BleTransport Runner"

    private var isPendingOnDone: Boolean = false
    private var isInBulkMode: Boolean = false
    private var isStopped: Boolean = false

    private var socket: WebSocket

    private val APDUQueue: ArrayList<String> = ArrayList()
    private var bulkSize: Int = -1
    private var nonce: Int = 0
    private var lastHSMMessage: String = ""

    private val knownOKWSMessages = arrayOf("CONTINUE", "TERMINATE")
    private val knownKOWSMessages = arrayOf(
        "CANCELLED",
        "SR DISCONNECTION",
        "INDEX OUT OF BOUNDS",
        "NOT CONNECTED TO SCRIPT RUNNER"
    )

    init {
        val httpClient = OkHttpClient.Builder()
            .build()

        val request = Request.Builder()
            .url(endpoint)
            .build()

        socket = httpClient.newWebSocket(request, this)
    }

    private fun handleNextAPDU() {
        if (APDUQueue.isNotEmpty()) {
            val apdu = APDUQueue.removeFirst()
            Timber.d("$tag => $apdu")
            bleManager.send(
                apduHex = apdu,
                onSuccess = { onDeviceResponse(it) },
                onError = {
                    onEvent(
                        RunnerAction.runError,
                        Arguments.fromBundle(bundleOf(Pair("error", it))),
                    )
                })
        } else if (isPendingOnDone) {
            onDone(lastHSMMessage)
        }
    }

    fun stop() {
        Timber.d("$tag Runner stop")
        isStopped = true
        socket.cancel()
        onStop()
    }

    private fun onDeviceResponse(response: String) {
        // Nb Remove the status code from the response, script-runner only wants the data.
        val data = response.dropLast(4)
        Timber.d("$tag <= $response")
        if (isInBulkMode) {
            val progress: Double = (bulkSize - APDUQueue.size) / bulkSize.toDouble()
            onEvent(
                RunnerAction.runProgress,
                Arguments.fromBundle(bundleOf(Pair("progress", progress))),
            )
            handleNextAPDU()
        } else {
            val out = """{"nonce":$nonce, "response":"success","data":"$data"}"""
            Timber.d("$tag -> $out")
            socket.send(out)
        }
    }

    // feat WebSocketListener
    override fun onOpen(webSocket: WebSocket, response: Response) {
        Timber.d("$tag connection with ws open")
        if (initialMessage != "") {
            webSocket.send(initialMessage)
        }
    }

    override fun onMessage(webSocket: WebSocket, text: String) {
        Timber.d("$tag <- ($text)")
        lastHSMMessage = text

        if (knownOKWSMessages.contains(text)) {
            Timber.d("$tag ws completed")
            isPendingOnDone = true
            return
        } else if (knownKOWSMessages.contains(text)) {
            Timber.d("$tag ws failed")
            onEvent(
                RunnerAction.runError,
                Arguments.fromBundle(bundleOf(Pair("error", text))),
            )
            return
        }

        val response = JSONTokener(text).nextValue() as JSONObject
        val query = response.getString("query")

        if (query.equals("bulk")) {
            Timber.d("$tag ws bulk mode")
            isInBulkMode = true
            APDUQueue.clear()

            val rawAPDUS = response.getJSONArray("data")
            for (i in 0 until rawAPDUS.length()) {
                val apdu: String = rawAPDUS.getString(i)
                APDUQueue.add(apdu)
            }
            bulkSize = APDUQueue.size
        } else {
            isInBulkMode = false
            APDUQueue.clear()
            APDUQueue.add(response.getString("data"))
            nonce = response.getInt("nonce")
        }

        handleNextAPDU()
    }

    override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
        Timber.d("$tag onClosed")
        if (isInBulkMode) {
            onDone(lastHSMMessage)
        } else {
            isPendingOnDone = true
        }
    }

    override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
        Timber.d("$tag error %s", t.message)
        onEvent(
            RunnerAction.runError,
            Arguments.fromBundle(bundleOf(Pair("error", "${t.message}"))),
        )
    }
}
