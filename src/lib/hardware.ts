/**
 * Hardware integration layer.
 * Browsers cannot talk to serial/USB devices directly except through WebUSB/WebSerial
 * (Chromium) — so we support two paths:
 *  1. Native browser printing to the OS-installed thermal / label printer (works everywhere)
 *  2. WebSerial raw ESC/POS commands (Chromium desktop) for cash-drawer kick + raw receipts
 */

export interface HardwareSettings {
  receiptPrinter: string;
  labelPrinter: string;
  paperWidth: "58mm" | "80mm";
  autoPrintReceipt: boolean;
  cashDrawerEnabled: boolean;
  scannerEnabled: boolean;
  scannerBeep: boolean;
  customerDisplay: boolean;
}

export const DEFAULT_HARDWARE: HardwareSettings = {
  receiptPrinter: "Browser / OS default",
  labelPrinter: "Browser / OS default",
  paperWidth: "80mm",
  autoPrintReceipt: true,
  cashDrawerEnabled: false,
  scannerEnabled: true,
  scannerBeep: true,
  customerDisplay: false,
};

const KEY = "shopflow.hardware";

export function loadHardware(): HardwareSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_HARDWARE, ...JSON.parse(raw) } : DEFAULT_HARDWARE;
  } catch {
    return DEFAULT_HARDWARE;
  }
}

export function saveHardware(s: HardwareSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function webSerialSupported() {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

/** ESC/POS drawer kick pulse (pin 2). Requires a WebSerial-connected printer. */
export async function kickCashDrawer(): Promise<{ ok: boolean; message: string }> {
  if (!webSerialSupported()) {
    return { ok: false, message: "Cash drawer needs Chrome/Edge on desktop (WebSerial)." };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const port: any = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    await writer.write(new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]));
    writer.releaseLock();
    await port.close();
    return { ok: true, message: "Cash drawer opened." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export function beep(freq = 880, ms = 90) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.07;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, ms);
  } catch {
    /* ignore */
  }
}

function printHtml(title: string, body: string, widthCss: string) {
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return false;
  w.document.write(`<html><head><title>${title}</title><style>
    @page { margin: 4mm; }
    body { font-family: 'Courier New', monospace; font-size: 12px; width: ${widthCss}; margin: 0 auto; }
    .c { text-align: center; } .b { font-weight: bold; }
    .row { display:flex; justify-content:space-between; }
    .line { border-top: 1px dashed #000; margin: 6px 0; }
    .barcode { font-family: 'Libre Barcode 39', monospace; letter-spacing: 2px; }
  </style></head><body>${body}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 250);
  return true;
}

export function printTestReceipt(settings: HardwareSettings) {
  const width = settings.paperWidth === "58mm" ? "52mm" : "72mm";
  return printHtml(
    "Printer test",
    `<div class="c b">SHOPFLOW PRO</div>
     <div class="c">Printer test page</div>
     <div class="line"></div>
     <div class="row"><span>Printer</span><span>${settings.receiptPrinter}</span></div>
     <div class="row"><span>Paper</span><span>${settings.paperWidth}</span></div>
     <div class="row"><span>Time</span><span>${new Date().toLocaleString()}</span></div>
     <div class="line"></div>
     <div class="c">If you can read this, printing works.</div>`,
    width
  );
}

export interface LabelSpec {
  name: string;
  sku?: string | null;
  barcode?: string | null;
  price: string;
}

export function printLabels(labels: LabelSpec[]) {
  const body = labels
    .map(
      (l) => `<div style="border:1px solid #000;padding:6px;margin:4px 0;text-align:center;page-break-inside:avoid">
        <div class="b" style="font-size:13px">${l.name}</div>
        <div style="font-size:11px">${l.sku ?? ""}</div>
        <div style="font-size:16px;font-weight:bold">${l.price}</div>
        <div style="font-size:11px;letter-spacing:3px">${l.barcode ?? ""}</div>
      </div>`
    )
    .join("");
  return printHtml("Labels", body, "60mm");
}
