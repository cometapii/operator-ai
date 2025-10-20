"use client";


import { PreviewMessage, type Message } from "./message";

type RealtimeMessageProps = {
  message: Message;
  status: "error" | "submitted" | "streaming" | "ready";
  isLatestMessage: boolean;
  isLoading: boolean;
};

export function RealtimeMessage(props: RealtimeMessageProps) {
  // PROSTY KOMPONENT BEZ OPTYMALIZACJI - PRAWDZIWY STREAMING
  // Każda zmiana props powoduje natychmiastowy rerender
  return <PreviewMessage {...props} />;
}
