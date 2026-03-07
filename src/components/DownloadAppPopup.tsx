import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";

const STORAGE_KEY = "app-download-popup-shown";

export function DownloadAppPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem(STORAGE_KEY);
    if (!shown) {
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleDownload = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.open("/app-release.apk", "_blank");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Download the App</DialogTitle>
          <DialogDescription className="text-center">
            Get the best experience with our mobile app. Download now for offline access and push notifications!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" /> Download APK
          </Button>
          <Button variant="ghost" onClick={handleClose}>
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
