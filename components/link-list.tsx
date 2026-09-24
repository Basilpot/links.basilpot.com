"use client";

import { useState, useTransition } from "react";
import { GripVertical } from "lucide-react";
import type { Link as ProfileLink } from "@/generated/prisma/client";
import { reorderLinks } from "@/app/actions";
import { LinkEditor } from "@/components/link-editor";
import { DeleteLinkConfirmation } from "@/components/delete-link-confirmation";
import { imageUrl } from "@/lib/image-url";

type Row = Pick<ProfileLink, "id" | "title" | "description" | "url" | "enabled" | "imagePath">;

export function LinkList({ links, clicks }: { links: Row[]; clicks: Record<string, number> }) {
  const [items, setItems] = useState(links);
  const [from, setFrom] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function move(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
    const next = [...items];
    const [row] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, row);
    setItems(next);
    startTransition(() => reorderLinks(next.map(link => link.id)));
  }

  return <div className="space-y-3">{items.map((link, i) => <div
    key={link.id}
    className={`panel relative flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-4 ${from === i ? "opacity-60" : over === i && from !== null ? "ring-2 ring-ring" : ""}`}
    draggable
    onDragStart={event => { setFrom(i); setOver(i); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", link.id); }}
    onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(i); }}
    onDrop={event => { event.preventDefault(); if (from !== null) move(from, i); setFrom(null); setOver(null); }}
    onDragEnd={() => { setFrom(null); setOver(null); }}
  >
    <GripVertical aria-hidden="true" className="absolute top-2 left-2 size-3.5 cursor-grab text-muted-foreground active:cursor-grabbing"/>
    <div className="min-w-0 flex-1 basis-full pl-6 sm:basis-0"><p className="font-medium">{link.title} {!link.enabled && <span className="ml-1 text-xs text-muted-foreground">Inactive</span>}</p><p className="truncate text-sm text-muted-foreground">{link.url}</p></div>
    <p className="text-xs text-muted-foreground sm:text-sm">{clicks[link.id] ?? 0} clicks</p>
    <div className="flex items-center gap-1"><LinkEditor link={link} existingImageUrl={link.imagePath ? imageUrl(link.imagePath) : undefined}/><DeleteLinkConfirmation id={link.id} title={link.title}/></div>
  </div>)}</div>;
}
