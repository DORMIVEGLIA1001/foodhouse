import { ReactNode } from 'react';

interface RestaurantSideColumnProps {
  children: ReactNode;
}

export default function RestaurantSideColumn({ children }: RestaurantSideColumnProps) {
  return <div className="xl:col-span-5 flex flex-col space-y-6 overflow-hidden h-full">{children}</div>;
}
