import { ReactNode } from 'react';

interface ChatMessagesPanelProps {
  children: ReactNode;
}

export default function ChatMessagesPanel({ children }: ChatMessagesPanelProps) {
  return <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">{children}</div>;
}
