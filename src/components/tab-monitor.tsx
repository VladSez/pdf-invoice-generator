"use client";

import { useEffect, useRef } from "react";
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
  const tabIdRef = useRef(crypto.randomUUID());
  const isOriginalTabRef = useRef(true);
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const lastResponseTimeRef = useRef(0);
  const activeToastIdRef = useRef<string | number>();

  useEffect(() => {
    // Create a new channel using broadcast-channel
    const channel = new BroadcastChannel("tab_monitor", {
      type: "idb",
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
        tabId: tabIdRef.current,
      });

      if (
        !isOriginalTabRef.current &&
        Date.now() - lastResponseTimeRef.current > 2000
      ) {
        isOriginalTabRef.current = true;
        if (activeToastIdRef.current) {
          toast.success("You can now use this tab", {
            id: activeToastIdRef.current,
            description: "Other duplicate tabs have been closed.",
            duration: 5000,
          });
        }
      }
    }

    function handleMessage(message: TabMessage) {
      if (message.tabId === tabIdRef.current) return;

      if (message.type === "TAB_CHECK") {
        broadcastMessage({
          type: "TAB_RESPONSE",
          timestamp: Date.now(),
          tabId: tabIdRef.current,
        });
      }

      if (message.type === "TAB_RESPONSE") {
        lastResponseTimeRef.current = Date.now();

        if (isOriginalTabRef.current) {
          activeToastIdRef.current = toast.warning(
            "This page is already open in another tab",
            {
              description:
                "Please close this duplicate tab to avoid any conflicts.",
              duration: Infinity,
              closeButton: true,
            }
          );
          isOriginalTabRef.current = false;
        }
      }
    }

    // Set up message listener
    channel.onmessage = handleMessage;

    checkIntervalRef.current = setInterval(broadcastCheck, 1000);
    broadcastCheck();

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      channel.close();
    };
  }, []);

  return null;
}
