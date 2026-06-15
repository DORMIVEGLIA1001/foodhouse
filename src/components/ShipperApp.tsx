import { ReactNode } from 'react';

interface ShipperAppProps {
  isVisible: boolean;
  children: ReactNode;
}

export default function ShipperApp({ isVisible, children }: ShipperAppProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div id="shipper-workspace" className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-stone-100">
      {children}
    </div>
  );
}
