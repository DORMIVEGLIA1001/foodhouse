import { ReactNode } from 'react';

interface RestaurantAppProps {
  isVisible: boolean;
  children: ReactNode;
}

export default function RestaurantApp({ isVisible, children }: RestaurantAppProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div id="restaurant-owner-workspace" className="flex-1 flex flex-col overflow-hidden p-6 bg-[#FCFBFA]">
      {children}
    </div>
  );
}
