const fs = require('fs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = `${__dirname}/video.proto`;

const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  { keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true },
);
const { videoservice } = grpc.loadPackageDefinition(packageDefinition);

function callVideo(call) {
  const { start, end } = call.metadata;

  console(call.metadata);
  const videoDataStream = fs.createReadStream('./sample.mp4');
  videoDataStream.on('data', chunk => {
    call.write({ videoStream: chunk });
  }).on('end', () => {
    call.end();
  });
}

function getServer() {
  const server = new grpc.Server();
  server.addService(videoservice.VideoService.service, {
    callVideo,
  });
  return server;
}

if (require.main === module) {
  // If this is run as a script, start a server on an unused port
  const videoServer = getServer();
  videoServer.bindAsync('0.0.0.0:9090', grpc.ServerCredentials.createInsecure(), () => {
    videoServer.start();
  });
}

exports.getServer = getServer;
