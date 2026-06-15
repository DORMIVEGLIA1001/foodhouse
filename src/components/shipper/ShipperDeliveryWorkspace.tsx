import { ReactNode } from 'react';

interface ShipperDeliveryWorkspaceProps {
  children: ReactNode;
}

export default function ShipperDeliveryWorkspace({ children }: ShipperDeliveryWorkspaceProps) {
  return <div className="flex-1 flex flex-col overflow-hidden h-full">{children}</div>;
}
