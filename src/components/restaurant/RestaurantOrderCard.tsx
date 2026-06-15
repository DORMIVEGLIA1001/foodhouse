import { ReactNode } from 'react';

interface RestaurantOrderCardProps {
  children: ReactNode;
}

export default function RestaurantOrderCard({ children }: RestaurantOrderCardProps) {
  return <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl hover:shadow-xs transition-shadow">{children}</div>;
}
