import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = "links-by-basilpot";
const project = "amkaxkwibayijmsjuioe";

function storage() {
  const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error("Supabase Storage credentials missing");
  return new S3Client({
    region: "ap-southeast-2",
    endpoint: `https://${project}.storage.supabase.co/storage/v1/s3`,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function imageUrl(path: string) {
  return `https://${project}.supabase.co/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadUrl(path: string, contentType: string) {
  return getSignedUrl(storage(), new PutObjectCommand({ Bucket: bucket, Key: path, ContentType: contentType }), { expiresIn: 300, signableHeaders: new Set(["content-type"]) });
}

export async function deleteImage(path: string) {
  await storage().send(new DeleteObjectCommand({ Bucket: bucket, Key: path }));
}
