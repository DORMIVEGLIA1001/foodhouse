import { ReactNode } from 'react';

interface ShipperRoutePanelProps {
  children: ReactNode;
}

export default function ShipperRoutePanel({ children }: ShipperRoutePanelProps) {
  return <div className="md:w-80 bg-stone-50 p-4 border-b md:border-b-0 md:border-r border-stone-200 overflow-y-auto flex flex-col justify-between shrink-0 h-full">{children}</div>;
}
