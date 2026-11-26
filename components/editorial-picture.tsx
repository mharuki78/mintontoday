"use client";

import { useState, type ComponentProps } from "react";
import { ImageOff } from "lucide-react";

export function EditorialPicture({ src, className = "", ...props }: ComponentProps<"img"> & { src: string }) {
  const [failedSource, setFailedSource] = useState<string>();
  if (failedSource === src) {
    return <span className={`${className} editorial-picture-unavailable`} role="img" aria-label="이미지를 불러오지 못했습니다">
      <ImageOff size={22} aria-hidden="true" />
    </span>;
  }
  return <img {...props} src={src} className={className} onError={() => setFailedSource(src)} ref={node => {
    if (node?.complete && !node.naturalWidth) setFailedSource(src);
  }} />;
}
