"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUpload, type ImageType } from "@/app/actions";

async function detectType(file: File): Promise<ImageType | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes.length > 8 && bytes.slice(0, 8).every((v, i) => v === [137, 80, 78, 71, 13, 10, 26, 10][i])) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export function ImagePicker({ id, name, label, existingImageUrl, error, kind }: { id: string; name: string; label: string; existingImageUrl?: string; error?: string; kind: "link" | "avatar" }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const image = removed ? null : preview ?? existingImageUrl;
  const visibleError = selectionError || error;
  const remove = () => { setRemoved(true); setPreview(null); setImagePath(""); setSelectionError(""); };

  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <label htmlFor={id} className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring">
      <input type="hidden" name="imagePath" value={imagePath}/>
      <input type="hidden" name="removeImage" value={removed ? "on" : ""}/>
      <Input id={id} name={name} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-invalid={!!visibleError} aria-describedby={visibleError ? `${id}-error` : undefined} onChange={async event => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) { setSelectionError("Image must be under 4 MB."); return; }
        const type = await detectType(file);
        if (!type) { setSelectionError("Use PNG, JPEG, or WebP image."); return; }
        setPreview(URL.createObjectURL(file));
        setRemoved(false);
        setSelectionError("");
        setUploading(true);
        setImagePath("");
        try {
          const result = await createUpload(kind, type);
          if ("error" in result) throw new Error(result.error);
          const response = await fetch(result.url, { method: "PUT", headers: { "content-type": type }, body: file });
          if (!response.ok) throw new Error("Upload failed.");
          setImagePath(result.path);
        } catch (error) {
          setSelectionError(error instanceof Error ? error.message : "Image upload failed. Try again.");
        } finally {
          setUploading(false);
        }
      }}/>
      {image ? <><Image src={image} alt={preview ? "Selected image preview" : "Current image"} fill unoptimized className="object-contain p-2"/><span className="relative rounded-md bg-background/90 px-2 py-1 text-xs font-medium">{uploading ? "Uploading…" : "Change image"}</span></> : <><ImagePlus className="size-7 text-muted-foreground" aria-hidden="true"/><span className="text-sm font-medium">{uploading ? "Uploading…" : "Upload image"}</span><span className="text-xs text-muted-foreground">PNG, JPEG, or WebP · max 4 MB</span></>}
    </label>
    {image && <button type="button" className="text-xs text-muted-foreground underline hover:text-foreground" onClick={remove}>Remove image</button>}
    {visibleError && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{visibleError}</p>}
  </div>;
}