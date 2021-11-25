# app-manifest-editor-demo

aab包修改manifest后重新打包的demo

你可以下载此项目，在demo文件夹下执行下列的操作步骤，快速尝试整个流程

### aab包修改与重新打包

1. 准备好你需要处理的aab包

2. 将aab包当成普通的zip压缩包进行解压，新建名为app的文件夹，将解压后的base文件夹（其他的不重要）放置到里面

3. 下载 https://github.com/soulan/aab-manifest-editor 项目里的`package.json`、`index.js`、`helpers.js`三个文件和`example-json`文件夹里的修改配置demo

4. 安装js运行库

       npm install

5. 根据项目实际需求和manifest层级情况，修改example-json里的配置内容；执行步骤6时，会在output文件夹生成AndroidManifest.json文件,可查看层级和验证修改是否成功

6. 根据实际需求执行命令

       node index.js --object-path element.application.meta-data[0] --set-elements examples/data-attributes.json

7. 下载`protobuf`并解压，新建名为proto的文件夹，将解压后的Resources.proto和Configuration.proto放置到里面

   https://mvnrepository.com/artifact/com.android.tools.build/aapt2-proto?repo=google

8. 将修改好的文件放置到原解压出来的app-base-manifest文件夹下

9. 将base文件夹内的所有数据进行zip打包（不包含base文件夹自身）

10. 下载`bundletool.jar`放置到同目录

   https://github.com/google/bundletool/releases

11. 执行命令重新生成aab包

        java -jar bundletool.jar build-bundle --modules=base.zip --output=app_new.aab



### aab测试与安装

1. 获取手机配置信息

       adb shell getprop ro.build.version.sdk
       adb shell wm size
       adb shell wm density
       java -jar bundletool.jar get-device-spec --output=./device-spec.json

执行完后会生成一个device-spec.json文件，这个是决定aab如何生成适配当前手机的apks

2. 编译aab，输出apks

       java -jar bundletool.jar build-apks --bundle=./app_new.aab --output=./app_new.apks --overwrite --ks=./key.jks --ks-pass=pass:123456 --ks-key-alias=key0 --key-pass=pass:123456 --device-spec=./device-spec.json

3. 安装apks到手机

       java -jar bundletool.jar install-apks --apks=./app_new.apks