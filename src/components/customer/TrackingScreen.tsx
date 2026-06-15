import { ReactNode } from 'react';

interface TrackingScreenProps {
  isActive: boolean;
  children: ReactNode;
}

export default function TrackingScreen({ isActive, children }: TrackingScreenProps) {
  if (!isActive) return null;
  return <>{children}</>;
}
