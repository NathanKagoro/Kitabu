/**
 * The one door every TRA receipt goes through. Today there is one connector,
 * the demo, which behaves like TRA (counters, verification number, Z number)
 * without contacting anyone. A live connector -- a TRA-approved VFD provider,
 * or TRA directly once licensed -- implements the same interface, and must run
 * on the server, where the shop's TRA certificate is kept (docs/TRA.md).
 */
import { nextCounters, receiptVerificationNumber, type FiscalCounters } from './tra';

export interface FiscalRequest {
  businessId: string;
  businessDay: string;
  issuedAt: Date;
}

export interface FiscalResult {
  status: 'issued' | 'pending' | 'failed';
  counters: FiscalCounters | null;
  rctvNum: string | null;
  verifyUrl: string | null;
  provider: string;
  ackCode: string | null;
  ackMessage: string | null;
}

export interface FiscalConnector {
  readonly mode: 'demo' | 'live';
  issue(request: FiscalRequest, lastCounters: { gc: number; dc: number; znum: string } | null): Promise<FiscalResult>;
}

/**
 * Behaves like TRA's VFD: an unbroken global counter, a daily counter that
 * restarts each business day, the day's Z number. Its verification numbers
 * start with DEMO and have no TRA link, so a demo receipt can never pass for
 * a real one.
 */
export const DEMO_RECEIPT_CODE = 'DEMO';

export const demoConnector: FiscalConnector = {
  mode: 'demo',
  async issue(request, lastCounters) {
    const counters = nextCounters(lastCounters, request.businessDay);
    return {
      status: 'issued',
      counters,
      rctvNum: receiptVerificationNumber(DEMO_RECEIPT_CODE, counters.gc),
      verifyUrl: null,
      provider: 'demo',
      ackCode: '0',
      ackMessage: 'demo',
    };
  },
};

/**
 * Live receipts are signed on the server, which isn't built yet: until then a
 * shop set to live gets its receipts queued as pending, never a fake one.
 */
export const liveQueueConnector: FiscalConnector = {
  mode: 'live',
  async issue() {
    return { status: 'pending', counters: null, rctvNum: null, verifyUrl: null, provider: 'server', ackCode: null, ackMessage: null };
  },
};
