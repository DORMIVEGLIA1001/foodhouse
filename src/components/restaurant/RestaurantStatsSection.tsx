import { ReactNode } from 'react';

interface RestaurantStatsSectionProps {
  children: ReactNode;
}

export default function RestaurantStatsSection({ children }: RestaurantStatsSectionProps) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{children}</div>;
}
