import { useCallback, useState } from "react";
import { supabase } from "@/src/integrations/supabase/client";

interface GeneratedImage {
  url: string;
  meta_data?: Record<string, any>;
}

interface GenerateOptions {
  model: string;
  prompt: string;
  type?: "txt_2_img" | "img_2_img";
  ratio?: string;
  resolution?: string;
  format?: string;
  resource_path?: string;
}

export function useAIImage() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (options: GenerateOptions) => {
    setError(null);
    setImages([]);
    setTaskId(null);
    setIsSubmitting(true);

    try {
      const image_option: Record<string, string> = {};
      if (options.ratio) image_option.ratio = options.ratio;
      if (options.resolution) image_option.resolution = options.resolution;
      if (options.format) image_option.format = options.format;

      const { data, error: invokeError } = await supabase.functions.invoke(
        "ai-image-submit-e0bb6c9e1e23",
        {
          body: {
            model: options.model,
            prompt: options.prompt,
            type: options.type ?? "txt_2_img",
            image_option,
            ...(options.resource_path ? { resource_path: options.resource_path } : {}),
          },
        }
      );

      if (invokeError) throw new Error(invokeError.message || "Failed to submit");
      if (!data?.success || !data.task_id) {
        throw new Error(data?.message || "Image generation failed");
      }

      setTaskId(data.task_id);
      return data.task_id as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit";
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const poll = useCallback(async (currentTaskId: string, maxAttempts = 60) => {
    setError(null);
    setIsPolling(true);

    try {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "ai-image-status-e0bb6c9e1e23",
          { body: { task_id: currentTaskId } }
        );

        if (invokeError) throw new Error(invokeError.message || "Failed to poll");
        if (!data) throw new Error("No task status received");
        if (data.status === "failed") throw new Error(data.error || "Image generation failed");
        if (data.status === "succeed") {
          const nextImages = data.images || [];
          setImages(nextImages);
          return nextImages;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      throw new Error("Timed out waiting for image generation");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to poll";
      setError(message);
      return null;
    } finally {
      setIsPolling(false);
    }
  }, []);

  const submitAndPoll = useCallback(async (options: GenerateOptions) => {
    const nextTaskId = await submit(options);
    if (!nextTaskId) return null;
    return poll(nextTaskId);
  }, [submit, poll]);

  const clearImages = useCallback(() => {
    setImages([]);
    setTaskId(null);
    setError(null);
  }, []);

  return {
    images,
    taskId,
    error,
    isSubmitting,
    isPolling,
    isLoading: isSubmitting || isPolling,
    submitAndPoll,
    clearImages,
  };
}
