import { Globe, Mail, type LucideIcon } from "lucide-react";
import { SiFacebook, SiGithub, SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { SocialPlatform } from "@/lib/core";

const icons: Record<SocialPlatform, IconType | LucideIcon> = {
  instagram: SiInstagram, x: SiX, github: SiGithub, linkedin: FaLinkedinIn,
  youtube: SiYoutube, facebook: SiFacebook, tiktok: SiTiktok,
  website: Globe, email: Mail,
};

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const Icon = icons[platform];
  return <Icon aria-hidden="true" className={className}/>;
}
