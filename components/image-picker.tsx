"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImagePicker({ id, name, label, existingImageUrl, error }: { id: string; name: string; label: string; existingImageUrl?: string; error?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const image = preview ?? existingImageUrl;
  const visibleError = selectionError || error;

  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <label htmlFor={id} className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring">
      <Input id={id} name={name} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-invalid={!!visibleError} aria-describedby={visibleError ? `${id}-error` : undefined} onChange={event => {
        const file = event.currentTarget.files?.[0];
        const tooLarge = !!file && file.size > 4 * 1024 * 1024;
        event.currentTarget.setCustomValidity(tooLarge ? "Image must be under 4 MB." : "");
        setSelectionError(tooLarge ? "Image must be under 4 MB." : "");
        setPreview(file && !tooLarge ? URL.createObjectURL(file) : null);
      }}/>
      {image ? <><Image src={image} alt={preview ? "Selected image preview" : "Current image"} fill unoptimized className="object-contain p-2"/><span className="relative rounded-md bg-background/90 px-2 py-1 text-xs font-medium">Change image</span></> : <><ImagePlus className="size-7 text-muted-foreground" aria-hidden="true"/><span className="text-sm font-medium">Upload image</span><span className="text-xs text-muted-foreground">PNG, JPEG, or WebP · max 4 MB</span></>}
    </label>
    {existingImageUrl && <p className="text-xs text-muted-foreground">Choose a new image to replace the current one.</p>}
    {visibleError && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{visibleError}</p>}
  </div>;
}
