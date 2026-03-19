package com.ledger.live

import android.content.Context
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.modules.network.OkHttpClientFactory
import okhttp3.Dispatcher
import okhttp3.OkHttpClient

/**
 * OkHttp client factory that increases max concurrent requests per host (default 5) to improve
 * boot-time request parallelism. See OkHttp Dispatcher.maxRequestsPerHost and
 * https://developer.apple.com/documentation/foundation/urlsessionconfiguration/httpmaximumconnectionsperhost
 * (iOS equivalent).
 */
class LedgerOkHttpClientFactory(private val context: Context) : OkHttpClientFactory {

  override fun createNewNetworkModuleClient(): OkHttpClient {
    val dispatcher = Dispatcher().apply {
      maxRequestsPerHost = MAX_REQUESTS_PER_HOST
    }
    return OkHttpClientProvider.createClientBuilder(context)
      .dispatcher(dispatcher)
      .build()
  }

  companion object {
    private const val MAX_REQUESTS_PER_HOST = 16
  }
}
