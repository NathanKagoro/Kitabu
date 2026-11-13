import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/cn';

describe('cn', () => {
  it('lets a later utility of the same kind win', () => {
    expect(cn('px-5 text-sm', 'px-3')).toBe('text-sm px-3');
    expect(cn('border-line', 'border-brand')).toBe('border-brand');
    expect(cn('border', 'border-2')).toBe('border-2');
  });

  it('keeps a side width and a colour together', () => {
    expect(cn('border-b-[4px] border-sign')).toBe('border-b-[4px] border-sign');
    expect(cn('border-b border-[3px]')).toBe('border-b border-[3px]');
  });

  it('keeps colours for different sides apart', () => {
    expect(cn('border-b border-b-paper border-l-[6px] border-l-band')).toBe('border-b border-b-paper border-l-[6px] border-l-band');
    expect(cn('border-l-band', 'border-l-loss')).toBe('border-l-loss');
  });
});
