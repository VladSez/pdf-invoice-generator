"use client";

import { z } from "zod";

interface UmamiEventData {
  [key: string]: string | number | boolean | undefined;
}

interface UmamiTrackOptions {
  url?: string;
  website?: string;
  data?: UmamiEventData;
}

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, options?: UmamiTrackOptions) => void;
    };
  }
}

/**
 * Track events with Umami Analytics
 * https://umami.is/docs/track-events
 * @returns Object containing track function
 */
export const umamiTrackEvent = (
  eventName: string,
  options?: UmamiTrackOptions
) => {
  if (typeof window === "undefined") return;

  const eventNameSchema = z.string().min(1).max(50);

  try {
    eventNameSchema.parse(eventName);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid event name:", error.errors[0].message);
      return;
    }
  }

  try {
    window.umami?.track(eventName, options);
  } catch (error) {
    console.error("Failed to track event:", error);
  }
};
