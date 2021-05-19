const PROTO_PATH = `${__dirname}/video.proto`;

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  { keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true },
);
const vs = grpc.loadPackageDefinition(packageDefinition).videoservice;

const REMOTE_URL = 'localhost:9090';
const client = new vs.VideoService(REMOTE_URL, grpc.credentials.createInsecure());

client.callVideo({}).on('data', chunk => {
  console.log(chunk.videoStream);
});
