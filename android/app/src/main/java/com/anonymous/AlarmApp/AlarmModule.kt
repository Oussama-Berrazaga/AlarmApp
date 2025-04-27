package com.anonymous.AlarmApp

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.AlarmClock
import com.facebook.react.bridge.*
import java.util.*

class AlarmModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "AlarmModule"
    }

    @ReactMethod
    fun setAlarm(hour: Int, minute: Int, title: String, message: String, days: ReadableArray, promise: Promise) {
        try {
            val context = reactApplicationContext
            
            // Method 1: Using AlarmClock Intent (recommended for user-visible alarms)
            val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
                putExtra(AlarmClock.EXTRA_HOUR, hour)
                putExtra(AlarmClock.EXTRA_MINUTES, minute)
                putExtra(AlarmClock.EXTRA_MESSAGE, title)
                
                // Set repeating days if provided
                if (days.size() > 0) {
                    val weekdays = ArrayList<Int>()
                    for (i in 0 until days.size()) {
                        weekdays.add(days.getInt(i))
                    }
                    putExtra(AlarmClock.EXTRA_DAYS, weekdays)
                }
                
                // Skip UI and set alarm directly
                putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            }
            
            // Make sure we have permission to start activity
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            
            promise.resolve("Alarm set successfully for $hour:$minute with title: $title")
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to set alarm: ${e.message}")
        }
    }

    @ReactMethod
    fun setExactAlarm(timestamp: Double, title: String, message: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Create a unique request code based on the timestamp
            val requestCode = timestamp.toLong().toInt()
            
            // Create intent for the alarm receiver
            val intent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra("TITLE", title)
                putExtra("MESSAGE", message)
            }
            
            val pendingIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // For Android 12+, need to check if we have permission
                PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            } else {
                PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT
                )
            }
            
            // Set exact alarm (will be inexact on newer Android versions unless app has permission)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    timestamp.toLong(),
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    timestamp.toLong(),
                    pendingIntent
                )
            }
            
            promise.resolve("Exact alarm set successfully for timestamp: $timestamp")
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to set exact alarm: ${e.message}")
        }
    }

    @ReactMethod
    fun cancelAlarm(timestamp: Double, promise: Promise) {
        try {
            val context = reactApplicationContext
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Create the same request code used when setting the alarm
            val requestCode = timestamp.toLong().toInt()
            
            // Create the same intent used for setting the alarm
            val intent = Intent(context, AlarmReceiver::class.java)
            
            val pendingIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
            } else {
                PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
            }
            
            // Cancel the alarm if the pending intent exists
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
                promise.resolve("Alarm canceled successfully")
            } else {
                promise.resolve("No alarm found to cancel")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to cancel alarm: ${e.message}")
        }
    }
}