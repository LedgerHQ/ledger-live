/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 Segment, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package com.segment.analytics.reactnative.core

import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import com.facebook.react.bridge.*
import com.segment.analytics.internal.Utils.getSegmentSharedPreferences
import java.util.concurrent.TimeUnit
import com.facebook.react.bridge.ReadableMap
import com.segment.analytics.*
import java.io.IOException
import java.net.HttpURLConnection



class RNAnalyticsModule(context: ReactApplicationContext): ReactContextBaseJavaModule(context) {
    override fun getName() = "RNAnalytics"

    fun createAnalytics(): Analytics {
        val a = Analytics.with(reactApplicationContext)
        a.getAnalyticsContext().putValue("ip", "0.0.0.0")
        return a
    }

    private val analytics
        get() = createAnalytics()

    companion object {
        private var singletonJsonConfig: String? = null
        private var versionKey = "version"
        private var buildKey = "build"
    }

    private fun getPackageInfo(): PackageInfo {
        val packageManager = reactApplicationContext.packageManager
        try {
            return packageManager.getPackageInfo(reactApplicationContext.packageName, 0)
        } catch (e: PackageManager.NameNotFoundException) {
            throw AssertionError("Package not found: " + reactApplicationContext.packageName)
        }
    }

    /**
     * Tracks application lifecycle events - Application Installed, Application Updated and Application Opened
     * This is built to exactly mirror the application lifecycle tracking in analytics-android
     */
    private fun trackApplicationLifecycleEvents(writeKey: String?) {
        // Get the current version.
        var packageInfo = this.getPackageInfo()
        val currentVersion = packageInfo.versionName
        val currentBuild = packageInfo.versionCode

        // Get the previous recorded version.
        val sharedPreferences = getSegmentSharedPreferences(reactApplicationContext, writeKey)
        val previousVersion = sharedPreferences.getString(versionKey, null)
        val previousBuild = sharedPreferences.getInt(buildKey, -1)

        // Check and track Application Installed or Application Updated.
        if (previousBuild == -1) {
            var installedProperties = Properties()
            installedProperties[versionKey] = currentVersion
            installedProperties[buildKey] = currentBuild
            analytics.track("Application Installed", installedProperties)
        } else if (currentBuild != previousBuild) {
            var updatedProperties = Properties()
            updatedProperties[versionKey] = currentVersion
            updatedProperties[buildKey] = currentBuild
            updatedProperties["previous_$versionKey"] = previousVersion
            updatedProperties["previous_$buildKey"] = previousBuild
            analytics.track("Application Updated", updatedProperties)
        }

        // Track Application Opened.
        var appOpenedProperties = Properties()
        appOpenedProperties[versionKey] = currentVersion
        appOpenedProperties[buildKey] = currentBuild
        analytics.track("Application Opened", appOpenedProperties)

        // Update the recorded version.
        val editor = sharedPreferences.edit()
        editor.putString(versionKey, currentVersion)
        editor.putInt(buildKey, currentBuild)
        editor.apply()
    }

    @ReactMethod
    fun setup(options: ReadableMap, promise: Promise) {
        val json = options.getString("json")
        val writeKey = options.getString("writeKey")

        if(singletonJsonConfig != null) {
            if(json == singletonJsonConfig) {
                return promise.resolve(null)
            }
            else {
                if (BuildConfig.DEBUG) {
                    return promise.resolve(this)
                }
                else {
                    return promise.reject("E_SEGMENT_RECONFIGURED", "Segment Analytics Client was allocated multiple times, please check your environment.")
                }
            }
        }

        val builder = Analytics
                .Builder(reactApplicationContext, writeKey)
                .flushQueueSize(options.getInt("flushAt"))

        if(options.getBoolean("recordScreenViews")) {
            builder.recordScreenViews()
        }

        if(options.hasKey("android") && options.getType("android") == ReadableType.Map) {
            val androidOptions = options.getMap("android")!!
            if(androidOptions.hasKey("flushInterval")) {
                builder.flushInterval(
                        androidOptions.getInt("flushInterval").toLong(),
                        TimeUnit.MILLISECONDS
                )
            }
            if(androidOptions.hasKey("collectDeviceId")) {
                builder.collectDeviceId(androidOptions.getBoolean("collectDeviceId"))
            }
        }

        if(options.getBoolean("debug")) {
            builder.logLevel(Analytics.LogLevel.VERBOSE)
        }

        if(options.getBoolean("trackAppLifecycleEvents")) {
            builder.trackApplicationLifecycleEvents()
        }

        if(options.hasKey("proxy") && options.getType("proxy") == ReadableType.Map) {
            val proxyOptions = options.getMap("proxy")!!

            builder.connectionFactory(object:ConnectionFactory() {
                override fun openConnection(url:String): HttpURLConnection {
                    val uri = Uri.parse(url)
                    val uriBuilder = uri.buildUpon();

                    if (proxyOptions.hasKey("scheme")) {
                        uriBuilder.scheme(proxyOptions.getString("scheme"))
                    }

                    if (proxyOptions.hasKey("host")) {
                        var host = proxyOptions.getString("host");

                        if (proxyOptions.hasKey("port")) {
                            host = host + ":" + proxyOptions.getInt("port");
                        }

                        uriBuilder.encodedAuthority(host)
                    }

                    if (proxyOptions.hasKey("path")) {
                        uriBuilder.path(proxyOptions.getString("path") + uri.path)
                    }

                    return super.openConnection(uriBuilder.toString())
                }
            })
        }

        try {
            Analytics.setSingletonInstance(
                    RNAnalytics.buildWithIntegrations(builder)
            )
        } catch(e2: IllegalStateException) {
            // pass if the error is due to calling setSingletonInstance multiple times

            // if you created singleton in native code already,
            // you need to promise.resolve for RN to properly operate
        } catch(e: Exception) {
            return promise.reject("E_SEGMENT_ERROR", e)
        }

        if(options.getBoolean("trackAppLifecycleEvents")) {
            this.trackApplicationLifecycleEvents(writeKey)
        }

        if(options.hasKey("defaultProjectSettings")) {
            builder.defaultProjectSettings(Utils.toValueMap(options.getMap("defaultProjectSettings")))
        }

        RNAnalytics.setupCallbacks(analytics)

        singletonJsonConfig = json
        promise.resolve(null)
    }

    @ReactMethod
    fun track(event: String, properties: ReadableMap?, integrations: ReadableMap?, context: ReadableMap?) =
            analytics.track(
                    event,
                    Properties() from properties,
                    optionsFrom(context, integrations)
            )

    @ReactMethod
    fun screen(name: String?, properties: ReadableMap?, integrations: ReadableMap?, context: ReadableMap?) =
            analytics.screen(
                    null,
                    name,
                    Properties() from properties,
                    optionsFrom(context, integrations)
            )

    @ReactMethod
    fun identify(userId: String?, traits: ReadableMap?, integrations: ReadableMap?, context: ReadableMap?) =
            analytics.identify(
                    userId,
                    Traits() from traits,
                    optionsFrom(context, integrations)
            )

    @ReactMethod
    fun group(groupId: String, traits: ReadableMap?, integrations: ReadableMap, context: ReadableMap) =
            analytics.group(
                    groupId,
                    Traits() from traits,
                    optionsFrom(context, integrations)
            )

    @ReactMethod
    fun alias(newId: String, integrations: ReadableMap?, context: ReadableMap?) =
            analytics.alias(
                    newId,
                    optionsFrom(context, integrations)
            )

    @ReactMethod
    fun reset() =
            analytics.reset()

    @ReactMethod()
    fun flush() =
            analytics.flush()

    @ReactMethod
    fun enable() =
            analytics.optOut(false)

    @ReactMethod
    fun disable() =
            analytics.optOut(true)

    @ReactMethod
    fun getAnonymousId(promise: Promise) =
            promise.resolve(analytics.getAnalyticsContext().traits().anonymousId())
}

private fun optionsFrom(context: ReadableMap?, integrations: ReadableMap?): Options {
    var options = Options()

    context?.toHashMap()?.forEach { (key, value) ->
        options.putContext(key, value)
    }

    integrations?.toHashMap()?.forEach { (key, value) ->
        if (value is HashMap<*, *>) {
            options.setIntegrationOptions(key, value.toMap() as Map<String, Any>)
        } else {
            options.setIntegration(key, value.toString().toBoolean())
        }
    }

    return options
}

private infix fun<T: ValueMap> T.from(source: ReadableMap?): T {
    if (source != null) {
        putAll(source.toHashMap())
    }

    return this
}
