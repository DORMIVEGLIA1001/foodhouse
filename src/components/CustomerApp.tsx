import { ReactNode } from 'react';

interface CustomerAppProps {
  isVisible: boolean;
  mainContent: ReactNode;
  sideContent: ReactNode;
}

export default function CustomerApp({ isVisible, mainContent, sideContent }: CustomerAppProps) {
  return (
    <div className={`flex-1 grid grid-cols-12 overflow-hidden ${!isVisible ? 'hidden' : ''}`}>
      <div className="col-span-12 lg:col-span-7 flex flex-col overflow-hidden">
        {mainContent}
      </div>

      <section className="col-span-12 lg:col-span-5 p-4 md:p-6 flex flex-col space-y-6 bg-stone-50 border-t lg:border-t-0 lg:border-l border-stone-200 overflow-y-auto">
        {sideContent}
      </section>
    </div>
  );
}
