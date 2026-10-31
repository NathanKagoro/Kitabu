import { OperatorMessages } from '@/components/admin/operator-messages';

/** The operator's screens carry their own wording, loaded only here. */
export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return <OperatorMessages>{children}</OperatorMessages>;
}
