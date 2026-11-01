'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { ExtraMessages, type MessageLoaders } from '@/components/extra-messages';
import { ScanBarcode } from '@/components/icons';
import { Sheet } from '@/components/ui/sheet';

interface Detector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type DetectorClass = new (options?: { formats?: string[] }) => Detector;

/** The phone's own barcode reader (Chrome on Android has one); none on most iPhones, so the button stays away there. */
function detectorClass(): DetectorClass | null {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
    ? ((window as unknown as { BarcodeDetector: DetectorClass }).BarcodeDetector ?? null)
    : null;
}

/**
 * Scan a product's barcode with the camera to add it to the sale. Loaded
 * after the till has shown (the sales screen imports it lazily), and only
 * shows its button on phones that can read barcodes.
 */
const loaders: MessageLoaders = {
  sw: () => import('@/messages/scan/sw.json'),
  en: () => import('@/messages/scan/en.json'),
};

export function BarcodeScan({ onCode }: { onCode: (code: string) => boolean }) {
  return (
    <ExtraMessages loaders={loaders}>
      <ScanButton onCode={onCode} />
    </ExtraMessages>
  );
}

function ScanButton({ onCode }: { onCode: (code: string) => boolean }) {
  const t = useTranslations('scanner');
  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Whether this phone can read barcodes is only known in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(detectorClass() !== null);
  }, []);
  if (!supported) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('scan')}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-line-strong bg-surface text-brand active:bg-paper"
      >
        <ScanBarcode size={22} />
      </button>
      {open ? <Scanner onCode={onCode} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function Scanner({ onCode, onClose }: { onCode: (code: string) => boolean; onClose: () => void }) {
  const t = useTranslations('scanner');
  const video = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState<'aim' | 'unknown' | 'noCamera'>('aim');

  useEffect(() => {
    const Detector = detectorClass();
    if (!Detector) return;
    const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
    let stream: MediaStream | null = null;
    let timer = 0;
    let live = true;
    let lastMiss = '';
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!live || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const look = async () => {
          if (!live || !video.current) return;
          try {
            const [hit] = await detector.detect(video.current);
            if (hit?.rawValue) {
              if (onCode(hit.rawValue)) {
                navigator.vibrate?.(60);
                onClose();
                return;
              }
              if (hit.rawValue !== lastMiss) {
                lastMiss = hit.rawValue;
                setMessage('unknown');
              }
            }
          } catch {
            // A frame that could not be read; try the next.
          }
          timer = window.setTimeout(() => void look(), 250);
        };
        void look();
      } catch {
        if (live) setMessage('noCamera');
      }
    })();
    return () => {
      live = false;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onCode, onClose]);

  return (
    <Sheet open onClose={onClose} title={t('scan')}>
      <div className="space-y-3 p-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-black">
          <video ref={video} muted playsInline className="h-full w-full object-cover" />
          <span aria-hidden className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-loss/80" />
        </div>
        <p className="text-center text-sm text-ink-soft" aria-live="polite">
          {t(`scanStatus.${message}`)}
        </p>
      </div>
    </Sheet>
  );
}
