import crypto from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getS3Client() {
  if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    return null;
  }

  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

export async function uploadObject(file: File, keyPrefix: string) {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

  if (!client || !bucket || !publicBaseUrl) {
    throw new Error("S3 object storage is not configured.");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const objectKey = `${keyPrefix}/${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: bytes,
      ContentType: file.type || "application/octet-stream",
    }),
  );

  return {
    objectKey,
    url: `${publicBaseUrl.replace(/\/$/, "")}/${objectKey}`,
    fileName: file.name,
    contentType: file.type || null,
  };
}
