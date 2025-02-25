import { useEffect } from "react";
import { toast } from "sonner";

const NUM_OF_OPEN_TABS_KEY = "EASY_INVOICE_PDF_NUM_OF_OPEN_TABS";

const isDesktop =
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

const CHECK_INTERVAL = isDesktop ? 1000 : 3000;
const TOAST_ID = "EASY_INVOICE_PDF_TAB_MONITOR_TOAST";
const WARNING_STATE_KEY = "EASY_INVOICE_PDF_TAB_MONITOR_WARNING_STATE";

/**
 * This is a custom hook that monitors the number of tabs that are open
 * and displays a warning if there are multiple tabs open.
 * This is to prevent multiple instances of the app from being open at the same time.
 */
export function useTabMonitor() {
  useEffect(() => {
    // Initialize tab count
    const initializeTabCount = () => {
      const numOfOpenTabs = localStorage.getItem(NUM_OF_OPEN_TABS_KEY);
      localStorage.setItem(
        NUM_OF_OPEN_TABS_KEY,
        ((numOfOpenTabs ? parseInt(numOfOpenTabs) : 0) + 1).toString()
      );
    };

    // Update tab count
    const updateTabCount = () => {
      const numOfOpenTabs = localStorage.getItem(NUM_OF_OPEN_TABS_KEY);
      const hasShownWarning =
        localStorage.getItem(WARNING_STATE_KEY) === "true";

      if (!numOfOpenTabs || parseInt(numOfOpenTabs) < 1) {
        initializeTabCount();
      } else {
        const tabCount = parseInt(numOfOpenTabs);
        if (tabCount > 1) {
          localStorage.setItem(WARNING_STATE_KEY, "true");

          toast.warning(`This page is already open in another tab`, {
            id: TOAST_ID,
            description: "Please close duplicate tabs to avoid any conflicts.",
            duration: Infinity,
            closeButton: true,
          });
        } else if (tabCount === 1 && hasShownWarning) {
          toast.success("Using a single tab", {
            id: TOAST_ID,
            description: "Other duplicate tabs have been closed.",
            duration: 5000,
          });

          localStorage.setItem(WARNING_STATE_KEY, "false");
        }
      }
    };

    // Set up initial count
    initializeTabCount();

    // Set up interval to check periodically
    const intervalId = setInterval(updateTabCount, CHECK_INTERVAL);

    // Cleanup function
    const handleTabClose = () => {
      const numOfOpenTabs = localStorage.getItem(NUM_OF_OPEN_TABS_KEY);
      if (numOfOpenTabs) {
        const updatedCount = Math.max(0, parseInt(numOfOpenTabs) - 1);
        localStorage.setItem(NUM_OF_OPEN_TABS_KEY, updatedCount.toString());
      }
    };

    // Add event listener for tab/window close
    window.addEventListener("beforeunload", handleTabClose);

    // Cleanup interval and event listener
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleTabClose);
      handleTabClose();
    };
  }, []);
}
