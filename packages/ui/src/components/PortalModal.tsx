"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export const PortalModal = ({ children }: { children: ReactNode }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};
