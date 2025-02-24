"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { BroadcastChannel } from "broadcast-channel";

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
    const tabId = crypto.randomUUID();
    let isOriginalTab = true;
    let checkInterval: NodeJS.Timeout;
    let lastResponseTime = 0;
    let activeToastId: string | number | undefined;

    // Create a new channel using broadcast-channel
    const channel = new BroadcastChannel("tab_monitor", {
      type: "localstorage",
      webWorkerSupport: false,
    });

    function broadcastMessage(message: TabMessage) {
      channel.postMessage({
        ...message,
        timestamp: Date.now(),
      });
    }

    function broadcastCheck() {
      broadcastMessage({
        type: "TAB_CHECK",
        timestamp: Date.now(),
        tabId,
      });

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

    function handleMessage(message: TabMessage) {
      if (message.tabId === tabId) return;

      if (message.type === "TAB_CHECK") {
        broadcastMessage({
          type: "TAB_RESPONSE",
          timestamp: Date.now(),
          tabId,
        });
      }

      if (message.type === "TAB_RESPONSE") {
        lastResponseTime = Date.now();

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
          isOriginalTab = false;
        }
      }
    }

    // Set up message listener
    channel.onmessage = handleMessage;

    checkInterval = setInterval(broadcastCheck, 1000);
    broadcastCheck();

    return () => {
      clearInterval(checkInterval);
      channel.close();
    };
  }, []);

  return null;
}
