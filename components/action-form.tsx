"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function Submit({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return <button className="button" disabled={pending}>{pending ? "Saving…" : children}</button>;
}
export function ActionForm({ action, children, className = "space-y-4", submit = "Save" }: {
  action: (state: string, form: FormData) => Promise<string>;
  children: ReactNode;
  className?: string;
  submit?: string;
}) {
  const [message, formAction] = useActionState(action, "");
  return <form action={formAction} className={className}>{children}<Submit>{submit}</Submit>{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}</form>;
}
