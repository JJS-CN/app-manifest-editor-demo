package com.jetpack.myapplication

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.TextView
import androidx.core.os.BuildCompat

class MainActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    val message = findViewById<TextView>(R.id.tv_message)
    message.text = "package:" + packageName + "  version:" + packageManager.getPackageInfo(
      packageName,
      0).versionName + "  verCode:" + packageManager.getPackageInfo(
      packageName,
      0).versionCode + "  channel:" + getChannel()
  }

  fun getChannel(): String {
    val appi: ApplicationInfo = baseContext.getPackageManager()
      .getApplicationInfo(baseContext.getPackageName(), PackageManager.GET_META_DATA)
    val bundle = appi.metaData
    return bundle["UMENG_CHANNEL"] as String
  }
}