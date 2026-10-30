"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, GripVertical, Link2 } from "lucide-react";
import type { Link as ProfileLink } from "@/generated/prisma/client";
import { reorderLinks } from "@/app/actions";
import { Button } from "@/components/ui/button";
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

  if (!items.length) return <div className="panel flex flex-col items-center gap-2 border-dashed py-12 text-center"><Link2 aria-hidden="true" className="size-8 text-muted-foreground"/><p className="font-semibold">No links yet</p><p className="max-w-xs text-sm text-muted-foreground">Add your first link and it shows up on your public page right away.</p></div>;

  return <ul className="space-y-3">{items.map((link, i) => <li
    key={link.id}
    className={`panel relative flex flex-wrap items-center gap-x-3 gap-y-2 transition-shadow hover:shadow-sm sm:gap-4 ${from === i ? "opacity-60" : over === i && from !== null ? "ring-2 ring-ring" : ""} ${link.enabled ? "" : "bg-muted/40"}`}
    draggable
    onDragStart={event => { setFrom(i); setOver(i); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", link.id); }}
    onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(i); }}
    onDrop={event => { event.preventDefault(); if (from !== null) move(from, i); setFrom(null); setOver(null); }}
    onDragEnd={() => { setFrom(null); setOver(null); }}
  >
    <GripVertical aria-hidden="true" className="hidden size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing sm:block"/>
    {link.imagePath && <Image src={imageUrl(link.imagePath)} alt="" width={40} height={40} unoptimized className="size-10 shrink-0 rounded-full object-cover"/>}
    <div className="min-w-0 flex-1 basis-3/5 sm:basis-0"><p className="flex items-center gap-2 font-medium"><span className="truncate">{link.title}</span>{!link.enabled && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">Inactive</span>}</p><p className="truncate text-sm text-muted-foreground">{link.url}</p></div>
    <p className="text-xs text-muted-foreground tabular-nums sm:text-sm">{clicks[link.id] ?? 0} {(clicks[link.id] ?? 0) === 1 ? "click" : "clicks"}</p>
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon" aria-label={`Move ${link.title} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp/></Button>
      <Button type="button" variant="ghost" size="icon" aria-label={`Move ${link.title} down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}><ArrowDown/></Button>
      <LinkEditor link={link} existingImageUrl={link.imagePath ? imageUrl(link.imagePath) : undefined}/><DeleteLinkConfirmation id={link.id} title={link.title}/>
    </div>
  </li>)}</ul>;
}
