const fs = require('fs')
const protobuf = require('protobufjs')
const { Command, Option } = require('commander')
const helpers = require('./helpers')
const { exit } = require('process')
const compressing = require('compressing')
const path = require("path");

const program = new Command()
program.version('0.0.1', '-v, --vers', 'get the current version')

const resolve = dir => path.join(__dirname, ".", dir);
const manifestOpt = new Option('-m, --manifest <file>', 'android manifest file').default('app/base/manifest/AndroidManifest.xml', 'app/base/manifest/AndroidManifest.xml')
const outputOpt = new Option('-o, --output <dir>', 'output directory for the AndroidManifest.pb and AndroidManifest.json').default('app/base/manifest/', 'app/base/manifest/')
const protoDirOpt = new Option('-p, --proto-dir <dir>', 'sets the location of the .proto files').default('proto/', 'proto/')

program
  .addOption(protoDirOpt)
  .option('--old-package-name <name>', 'change the occourcen of --old-package-name to --new-package-name')
  .option('--new-package-name <name>', 'only usable in conjunction with --old-package-name')
  .option('--delete-acitivty <activity>', 'delete an activity like: "com.google.android.gms.tagmanager.TagManagerPreviewActivity"')
  .option('--delete-permission <permission>', 'delete a permission like: "android.permission.ACCESS_BACKGROUND_LOCATION"')
  .option('--object-path <dir>', 'path of the object youw ant to manipulate (used for --set-elements)')
  .option('--set-elements <json>', 'sets the elements at a given path based on an input map in json format (needs -p)')
  .option('--verbose', 'verbose... you know')
  .option('--in-aab <file>', 'in aab')
  .addOption(manifestOpt)
  .addOption(outputOpt)

program.parse(process.argv)

const options = program.opts()

async function main () {
  const proto = await protobuf.load(`${options.protoDir}/Resources.proto`)

  // Obtain a message type
  const ProtobufXml = proto.lookupType('aapt.pb.XmlNode')



  // We decode the ProtoBuffer and we replace the package immeditaly after reading it
  // this makes just working with the file a little bit easier
  // because we do not need to keep a bunch of copies

  if(options.inAab){
  console.log('options.inAab name is :'+options.inAab)
  //进行解压
  await compressing.zip.uncompress(options.inAab, './app')
  //解压成功
  console.log('inAab unzip success')
  }else{
   console.log('options.inAab is false')
  }
   const buffer = fs.readFileSync(options.manifest)
     const message = ProtobufXml.decode(buffer)
  if ((options.oldPackageName && !options.newPackageName) || (!options.oldPackageName && options.newPackageName)) {
    console.err('--new-package-name only usable in conjunction with --old-package-name')
    return 1
  }
  if (options.oldPackageName && options.newPackageName) {
    if (options.verbose) {
      console.log(`changing package name from ${options.oldPackageName} to ${options.newPackageName}`)
    }

    helpers.replacePackageName(message, options.oldPackageName, options.newPackageName)
  }

  if ((options.objectPath && !options.setElements) || (!options.objectPath && options.setElements)) {
    console.err('--setElements only usable in conjunction with --objectPath')
    return 2
  }
  if (options.objectPath && options.setElements) {
    if (options.verbose) {
      console.log(`changing values at ${options.objectPath} to values in ${options.setElements}`)
    }

    const raw = fs.readFileSync(options.setElements)
    const data = JSON.parse(raw)
    if (options.verbose) {
      console.log('got values', data)
    }
    helpers.setElementsAtPath(message, options.objectPath, data)
  }

  if (options.deletePermission) {
    if (options.verbose) {
      console.log(`deleting permission ${options.deletePermission}`)
    }

    helpers.deletePermission(message, options.deletePermission)
  }

  if (options.deleteAcitivty) {
    if (options.verbose) {
      console.log(`deleting activity ${options.deleteAcitivty}`)
    }

    helpers.deleteActivityByName(message, options.deleteAcitivty)
  }

  const reenc = ProtobufXml.create(message)
  const pbBuffer = ProtobufXml.encode(reenc).finish()

  if (options.verbose) {
    console.log(`writing '${options.output + 'AndroidManifest.json'}'`)
  }
  fs.writeFileSync('output/AndroidManifest.json', JSON.stringify(message, null, 4))

  if (options.verbose) {
    console.log(`writing '${options.output + 'AndroidManifest.xml'}'`)
  }
  //修改输出路径，直接覆盖原目录
  fs.writeFileSync(options.output + 'AndroidManifest.xml', pbBuffer)
  //生成xml成功
  console.log('write AndroidManifest.xml success ')
  //zip打包
  await compressing.zip.compressDir("app/base/", './base_new.zip', { ignoreBase: true  })

  console.log('base_new.zip output success ')

  //重新生成aab
  var exec =require('child_process').exec,child
  child= exec("java -jar bundletool.jar build-bundle --modules=./base_new.zip --output=./app_new.aab",function (error, stdout, stderr){
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      });
  console.log('app_new.aab output success ')

  return 0
}

main()
  .then((code) => {
    exit(code)
  })
  .catch((err) => {
    console.log(err)
    exit(999)
  })