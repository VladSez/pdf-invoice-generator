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
    const tabId = crypto.randomUUID();
    let isOriginalTab = true;
    let checkInterval: NodeJS.Timeout;
    let lastResponseTime = 0;
    let activeToastId: string | number | undefined;

    // Check if BroadcastChannel is supported
    const isBroadcastSupported = "BroadcastChannel" in window;
    const channel = isBroadcastSupported
      ? new BroadcastChannel("tab_monitor")
      : null;

    function broadcastMessage(message: TabMessage) {
      if (isBroadcastSupported) {
        channel?.postMessage(message);
      } else {
        // Fallback: Use localStorage
        localStorage.setItem(
          "tab_monitor_message",
          JSON.stringify({
            ...message,
            timestamp: Date.now(),
          })
        );
        // Trigger storage event in other tabs
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "tab_monitor_message",
          })
        );
      }
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

    // Handle messages based on browser support
    if (isBroadcastSupported) {
      channel?.addEventListener("message", (event) =>
        handleMessage(event.data)
      );
    } else {
      window.addEventListener("storage", (event) => {
        if (event.key === "tab_monitor_message") {
          const message = JSON.parse(event.newValue || "{}") as TabMessage;
          handleMessage(message);
        }
      });
    }

    // eslint-disable-next-line prefer-const
    checkInterval = setInterval(broadcastCheck, 1000);
    broadcastCheck();

    return () => {
      if (isBroadcastSupported) {
        // @ts-expect-error - TODO: fix this
        channel?.removeEventListener("message", handleMessage);
        channel?.close();
      } else {
        // @ts-expect-error - TODO: fix this
        window.removeEventListener("storage", handleMessage);
      }
      clearInterval(checkInterval);
    };
  }, []);

  return null;
}
