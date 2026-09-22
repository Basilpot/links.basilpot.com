"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteLink } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Deleting…" : "Delete link"}</Button>;
}

export function DeleteLinkConfirmation({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const form = <form action={deleteLink}>
    <input type="hidden" name="id" value={id}/>
    <ConfirmButton/>
  </form>;
  const description = `Delete “${title}”? This cannot be undone.`;

  return <>
    <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${title}`} onClick={() => setOpen(true)}><Trash2/></Button>
    {desktop ? <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent><DialogHeader><DialogTitle>Delete link</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>{form}</DialogFooter></DialogContent>
    </Dialog> : <Drawer open={open} onOpenChange={setOpen} swipeDirection="down">
      <DrawerContent><DrawerHeader><DrawerTitle>Delete link</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader><DrawerFooter>{form}<DrawerClose render={<Button type="button" variant="outline" />}>Cancel</DrawerClose></DrawerFooter></DrawerContent>
    </Drawer>}
  </>;
}
