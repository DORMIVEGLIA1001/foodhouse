import { ReactNode } from 'react';

interface RestaurantOrdersBoardProps {
  children: ReactNode;
}

export default function RestaurantOrdersBoard({ children }: RestaurantOrdersBoardProps) {
  return <div className="xl:col-span-7 flex flex-col bg-white border border-stone-200 rounded-2xl p-5 overflow-hidden">{children}</div>;
}
