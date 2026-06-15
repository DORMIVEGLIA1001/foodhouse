import { ReactNode } from 'react';

interface ChatScreenProps {
  isActive: boolean;
  children: ReactNode;
}

export default function ChatScreen({ isActive, children }: ChatScreenProps) {
  if (!isActive) return null;
  return <div id="chat-workspace" className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">{children}</div>;
}
