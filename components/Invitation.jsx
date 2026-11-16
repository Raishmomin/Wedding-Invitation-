"use client";

import { useEffect, useRef } from "react";
import { MARKUP } from "@/lib/markup";
import { initInvitation } from "@/lib/invitation";
import { guestOrDefault } from "@/lib/guest";

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* The whole invitation. `guest` is the name taken from the link ("" for the general link). */
export default function Invitation({ guest = "" }) {
  const root = useRef(null);
  const html = MARKUP.replaceAll("__GUEST__", escapeHtml(guestOrDefault(guest)));

  useEffect(() => {
    initInvitation(root.current, guest);
    return () => document.body.classList.remove("locked", "opened");
  }, [guest]);

  return <div ref={root} dangerouslySetInnerHTML={{ __html: html }} />;
}
