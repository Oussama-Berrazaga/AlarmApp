package com.anonymous.AlarmApp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("TITLE") ?: "Alarm"
        val message = intent.getStringExtra("MESSAGE") ?: "Your alarm is ringing!"
        
        // Get the package name to create an intent for opening the app when notification is clicked
        val packageName = context.packageName
        val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
        
        val pendingIntent = if (launchIntent != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.getActivity(
                    context, 
                    0, 
                    launchIntent, 
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            } else {
                PendingIntent.getActivity(
                    context, 
                    0, 
                    launchIntent, 
                    PendingIntent.FLAG_UPDATE_CURRENT
                )
            }
        } else {
            null
        }
        
        // Create a notification channel for Android 8.0+
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Alarm Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for triggered alarms"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }
        
        // Build the notification
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(1000, 1000, 1000, 1000, 1000))
            
        // Add the intent to open the app when notification is clicked, if available
        if (pendingIntent != null) {
            notification.setContentIntent(pendingIntent)
        }
        
        // Show the notification
        notificationManager.notify(System.currentTimeMillis().toInt(), notification.build())
    }
    
    companion object {
        private const val CHANNEL_ID = "alarm_notification_channel"
    }
}