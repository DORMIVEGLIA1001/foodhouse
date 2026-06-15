import { ReactNode } from 'react';

interface OrderHistoryPanelProps {
  children: ReactNode;
}

export default function OrderHistoryPanel({ children }: OrderHistoryPanelProps) {
  return <div id="previous-orders-panel" className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">{children}</div>;
}
