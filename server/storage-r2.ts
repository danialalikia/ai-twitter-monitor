// Cloudflare R2 storage helpers
// Uses S3-compatible API

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
};

function getR2Config(): R2Config {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET || "ai-twitter-monitor";

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "R2 credentials missing: set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT"
    );
  }

  return { accessKeyId, secretAccessKey, endpoint, bucket };
}

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    const config = getR2Config();
    _s3Client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return _s3Client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getR2Config();
  const key = normalizeKey(relKey);
  const client = getS3Client();

  const body = typeof data === "string" ? Buffer.from(data) : data;

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);

  // R2 public URL format
  const url = `${config.endpoint}/${config.bucket}/${key}`;

  return { key, url };
}

export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const config = getR2Config();
  const key = normalizeKey(relKey);
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  // Generate presigned URL
  const url = await getSignedUrl(client, command, { expiresIn });

  return { key, url };
}
