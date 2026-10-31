'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useApp } from '@/components/app-provider';
import { OptionGrid } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Keypad, parseKeypad } from '@/components/ui/keypad';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { recordWithdrawal } from '@/lib/local/actions';
import { formatTZS } from '@/lib/money';
import type { OwnerWithdrawal, WithdrawalPurpose } from '@/lib/types';

const PURPOSES: readonly WithdrawalPurpose[] = ['personal', 'bank'];
const FROM: readonly OwnerWithdrawal['method'][] = ['cash', 'mpesa', 'bank'];

/**
 * "Toa pesa": the owner takes money out, for themselves or to the bank. Only
 * money taken from the tin lowers the cash expected there; profit never moves.
 */
export function WithdrawSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('summary');
  const tm = useTranslations('money');
  const toast = useToast();
  const { businessId, userId, member } = useApp();
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState<WithdrawalPurpose>('personal');
  const [from, setFrom] = useState<OwnerWithdrawal['method']>('cash');
  const value = Math.round(parseKeypad(amount));

  const save = async () => {
    if (!businessId || value <= 0) return;
    await recordWithdrawal({ businessId, userId, memberId: member?.id ?? null, amount: value, purpose, method: from });
    toast(t('withdrawn'));
    setAmount('');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('withdrawTitle')}>
      <div className="space-y-4 p-4">
        <p className="text-sm text-ink-soft">{t('withdrawHint')}</p>
        <p className="tnum text-center text-4xl font-bold">{formatTZS(value)}</p>
        <Keypad value={amount} onChange={setAmount} />
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-ink-soft">{t('withdrawPurpose')}</p>
          <OptionGrid<WithdrawalPurpose>
            value={purpose}
            onChange={setPurpose}
            options={PURPOSES.map((p) => ({ value: p, label: t(`purposes.${p}`) }))}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-ink-soft">{t('withdrawFrom')}</p>
          <OptionGrid<OwnerWithdrawal['method']>
            value={from}
            onChange={setFrom}
            columns={3}
            options={FROM.map((m) => ({ value: m, label: tm(`sources.${m}`) }))}
          />
        </div>
        <Button size="xl" block disabled={value <= 0} onClick={() => void save()}>
          {t('withdrawButton')}
        </Button>
      </div>
    </Sheet>
  );
}
