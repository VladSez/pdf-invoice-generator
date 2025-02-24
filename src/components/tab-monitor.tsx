"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface TabMessage {
  type: "TAB_CHECK" | "TAB_RESPONSE";
  timestamp: number;
  tabId: string;
}

/**
 * This component is used to monitor the current tab and check if it is the original tab.
 * If it is not, it will show a toast warning.
 * This is useful to avoid conflicts when the user has multiple tabs open.
 */
export function TabMonitor() {
  useEffect(() => {
    // Generate unique ID for this tab
    const tabId = crypto.randomUUID();
    const channel = new BroadcastChannel("tab_monitor");
    let isOriginalTab = true;
    let checkInterval: NodeJS.Timeout;
    let lastResponseTime = 0;
    let activeToastId: string | number | undefined;

    function broadcastCheck() {
      channel.postMessage({
        type: "TAB_CHECK",
        timestamp: Date.now(),
        tabId,
      } as TabMessage);

      // If we haven't received a response in 2 seconds, assume other tabs are closed
      if (!isOriginalTab && Date.now() - lastResponseTime > 2000) {
        isOriginalTab = true;
        if (activeToastId) {
          toast.success("You can now use this tab", {
            id: activeToastId,
            description: "Other duplicate tabs have been closed.",
            duration: 5000,
          });
        }
      }
    }

    function handleMessage(event: MessageEvent<TabMessage>) {
      const { data } = event;

      if (data.type === "TAB_CHECK" && data.tabId !== tabId) {
        // When we receive a check message from another tab,
        // respond back to let them know this tab exists
        channel.postMessage({
          type: "TAB_RESPONSE",
          timestamp: Date.now(),
          tabId,
        } as TabMessage);
      }

      if (data.type === "TAB_RESPONSE" && data.tabId !== tabId) {
        // When we receive a response from another tab:
        // 1. Update the last response time to track active tabs
        lastResponseTime = Date.now();

        // 2. If this was previously considered the original tab,
        // show a warning toast that this is actually a duplicate
        if (isOriginalTab) {
          activeToastId = toast.warning(
            "This page is already open in another tab",
            {
              description:
                "Please close this duplicate tab to avoid any conflicts.",
              duration: Infinity,
              closeButton: true,
            }
          );
          // 3. Mark this tab as non-original
          isOriginalTab = false;
        }
      }
    }

    // Start monitoring
    channel.addEventListener("message", handleMessage);

    // eslint-disable-next-line prefer-const
    checkInterval = setInterval(broadcastCheck, 1000);
    broadcastCheck();

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      clearInterval(checkInterval);
    };
  }, []);

  // Return null as this is a utility component
  return null;
}
