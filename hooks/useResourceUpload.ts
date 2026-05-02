import { useState, useCallback, useRef } from "react";
import { supabase } from "@/src/integrations/supabase/client";

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  resourcePath: string | null;
  previewUrl: string | null;
}

const UPLOAD_CONFIG = {
  maxFileSizeMB: 10,
  allowedExtensions: ["jpg", "jpeg", "png", "gif", "webp"],
};

export function useResourceUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    resourcePath: null,
    previewUrl: null,
  });
  const previewUrlRef = useRef<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const maxSizeBytes = UPLOAD_CONFIG.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum: ${UPLOAD_CONFIG.maxFileSizeMB}MB`;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
      return `Unsupported type. Allowed: ${UPLOAD_CONFIG.allowedExtensions.join(", ")}`;
    }
    return null;
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const newPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = newPreviewUrl;

    setState({ isUploading: true, progress: 0, error: null, resourcePath: null, previewUrl: newPreviewUrl });

    try {
      const validationError = validateFile(file);
      if (validationError) throw new Error(validationError);

      setState(prev => ({ ...prev, progress: 10 }));

      const { data, error: invokeError } = await supabase.functions.invoke<{
        success: boolean;
        upload_url?: string;
        resource_path?: string;
        message?: string;
      }>("upload-resource-e0bb6c9e1e23", {
        body: { file_name: file.name, file_size: file.size },
      });

      if (invokeError) throw new Error(invokeError.message || "Failed to get upload URL");
      if (!data?.success || !data.upload_url || !data.resource_path) {
        throw new Error(data?.message || "Failed to get upload URL");
      }

      setState(prev => ({ ...prev, progress: 30 }));

      const uploadResponse = await fetch(data.upload_url, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      setState(prev => ({ ...prev, progress: 100, resourcePath: data.resource_path!, isUploading: false }));
      return data.resource_path;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setState(prev => ({ ...prev, error: errorMessage, isUploading: false }));
      return null;
    }
  }, [validateFile]);

  const reset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setState({ isUploading: false, progress: 0, error: null, resourcePath: null, previewUrl: null });
  }, []);

  return { ...state, uploadFile, reset, validateFile };
}
