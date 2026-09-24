"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, SquarePen } from "lucide-react";
import type { Link as ProfileLink } from "@/generated/prisma/client";
import { saveLink } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImagePicker } from "@/components/image-picker";

type EditableLink = Pick<ProfileLink, "id" | "title" | "description" | "url" | "enabled">;

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save link" : "Add link"}</Button>;
}

export function LinkEditor({ link, existingImageUrl }: { link?: EditableLink; existingImageUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);


  async function submit(form: FormData) {
    const result = await saveLink("", form);
    if (result === "Saved.") {
      setOpen(false);
      setMessage("");
    } else {
      setMessage(result);
    }
  }

  const title = link ? "Edit link" : "Add link";
  const description = "Title and URL are required. Description and image are optional.";
  const form = <form action={submit} className="space-y-4">
    <input type="hidden" name="id" value={link?.id ?? ""}/>
    <div className="space-y-2"><Label htmlFor="link-title">Title</Label><Input id="link-title" name="title" maxLength={100} defaultValue={link?.title} required/></div>
    <div className="space-y-2"><Label htmlFor="link-description">Description</Label><Textarea id="link-description" name="description" maxLength={240} defaultValue={link?.description}/></div>
    <ImagePicker key={open ? "open" : "closed"} id="link-image" name="image" label="Image" existingImageUrl={existingImageUrl} kind="link"/>
    <div className="space-y-2"><Label htmlFor="link-url">URL</Label><Input id="link-url" name="url" type="url" placeholder="https://example.com" defaultValue={link?.url} required/></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={link?.enabled ?? true}/> Active</label>
    {message && <p role="status" className="text-sm text-destructive">{message}</p>}
    <SaveButton editing={!!link}/>
  </form>;

  return <>
    <Button type="button" variant={link ? "ghost" : "default"} size={link ? "icon" : "default"} aria-label={link ? `Edit ${link.title}` : undefined} onClick={() => { setMessage(""); setOpen(true); }}>
      {link ? <SquarePen/> : <><Plus/> Add link</>}
    </Button>
    {desktop ? <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>{form}</DialogContent>
    </Dialog> : <Drawer open={open} onOpenChange={setOpen} swipeDirection="down">
      <DrawerContent className="max-h-[90dvh]"><DrawerHeader><DrawerTitle>{title}</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader><div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">{form}</div><DrawerFooter><DrawerClose render={<Button type="button" variant="outline" />}>Cancel</DrawerClose></DrawerFooter></DrawerContent>
    </Drawer>}
  </>;
}
