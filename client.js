const PROTO_PATH = `${__dirname}/video.proto`;

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const fs = require('fs');

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

const app = express();

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.get('/video', (req, res) => {
  // Ensure there is a range given for the video
  const { range } = req.headers;
  if (!range) {
    res.status(400).send('Requires Range header');
  }

  // get video stats (about 61MB)
  const videoPath = 'sample.mp4';
  const videoSize = fs.statSync('sample.mp4').size;

  // Parse Range
  // Example: "bytes=32324-"
  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoPath, { start, end });
  const metadata = new grpc.Metadata();
  metadata.add('start', start);
  metadata.add('end', end);

  client.callVideo({}, metadata).on('data', chunk => {
    console.log(chunk.videoStream);
  });

  // Stream the video chunk to the client
  videoStream.pipe(res);
});

app.listen(8000, () => {
  console.log('Listening on port 8000!');
});
