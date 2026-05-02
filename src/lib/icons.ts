// @ts-nocheck
// Compatibility layer for lucide-react icon name changes.
// Re-exports all icons + provides aliases for renamed/removed icons.
export * from 'lucide-react';
import {
  CloudUpload,
  Wand,
  Pencil,
  Ellipsis,
  Loader,
  LayoutTemplate,
  AlignStartHorizontal,
} from 'lucide-react';

// Aliases for icons removed/renamed in newer lucide-react versions
export const UploadCloud = CloudUpload;
export const Wand2 = Wand;
export const Edit2 = Pencil;
export const MoreHorizontal = Ellipsis;
export const Loader2 = Loader;
export const Layout = LayoutTemplate;
export const AlignLeft = AlignStartHorizontal;
export const AlignJustify = AlignStartHorizontal;
