import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Loader2, Sparkles, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScannedProduct {
  name: string;
  brand?: string;
  category?: string;
  barcode?: string;
  unit?: string;
  estimated_price_ksh: number;
  estimated_cost_ksh?: number;
  description?: string;
  confidence: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete: (data: ScannedProduct) => void;
}

export function AIProductScanner({ open, onOpenChange, onScanComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. You can upload an image instead.");
    }
  };

  useEffect(() => {
    if (open && !preview) startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
    stopCamera();
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setPreview(null);
    startCamera();
  };

  const analyze = async () => {
    if (!preview) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-product", {
        body: { image: preview },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Identified: ${data.name} (${Math.round((data.confidence || 0) * 100)}% confidence)`);
      onScanComplete(data as ScannedProduct);
      handleClose();
    } catch (e: any) {
      console.error("Scan error:", e);
      toast.error(e.message || "Failed to identify product. Try a clearer image.");
    } finally {
      setScanning(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setPreview(null);
    setScanning(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Product Scanner
          </DialogTitle>
          <DialogDescription>
            Point your camera at a product label or barcode, or upload a photo. AI will identify it and fill in the form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Captured product" className="w-full h-full object-contain" />
            ) : (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                    Starting camera...
                  </div>
                )}
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          <div className="flex flex-wrap gap-2 justify-center">
            {!preview ? (
              <>
                <Button onClick={captureFromCamera} disabled={!cameraReady}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={retake} disabled={scanning}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={analyze} disabled={scanning}>
                  {scanning ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Identify Product</>
                  )}
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={handleClose} disabled={scanning}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
