import { ReactNode } from 'react';

interface ReservationsScreenProps {
  isActive: boolean;
  children: ReactNode;
}

export default function ReservationsScreen({ isActive, children }: ReservationsScreenProps) {
  if (!isActive) return null;
  return <div id="reservations-workspace" className="flex-1 flex flex-col p-6 overflow-hidden">{children}</div>;
}
