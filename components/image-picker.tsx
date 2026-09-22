"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImagePicker({ id, name, label, existingImageUrl }: { id: string; name: string; label: string; existingImageUrl?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const image = preview ?? existingImageUrl;

  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <label htmlFor={id} className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring">
      <Input id={id} name={name} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => setPreview(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : null)}/>
      {image ? <><Image src={image} alt={preview ? "Selected image preview" : "Current image"} fill unoptimized className="object-contain p-2"/><span className="relative rounded-md bg-background/90 px-2 py-1 text-xs font-medium">Change image</span></> : <><ImagePlus className="size-7 text-muted-foreground" aria-hidden="true"/><span className="text-sm font-medium">Upload image</span><span className="text-xs text-muted-foreground">PNG, JPEG, or WebP · max 1 MB</span></>}
    </label>
    {existingImageUrl && <p className="text-xs text-muted-foreground">Choose a new image to replace the current one.</p>}
  </div>;
}
