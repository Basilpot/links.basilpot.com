"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your link", url);
    }
  }

  return <Button type="button" variant="outline" size="lg" onClick={copy}>
    {copied ? <Check aria-hidden="true"/> : <Copy aria-hidden="true"/>}
    <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
  </Button>;
}
