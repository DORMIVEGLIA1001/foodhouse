import { ReactNode } from 'react';

interface ShipperOrdersListProps {
  children: ReactNode;
}

export default function ShipperOrdersList({ children }: ShipperOrdersListProps) {
  return <div className="lg:w-96 flex flex-col bg-white border-r border-stone-200 overflow-hidden shrink-0 h-full">{children}</div>;
}
