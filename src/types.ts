export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  status: "En ligne" | "Hors ligne" | string; // Garder la flexibilité pour le moment
  bio?: string;
  phone?: string;
  location?: string;
}

export interface Conversation {
  id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar: string;
  other_user_status: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export interface Message {
  id: number;
  content: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  created_at: string;
  sender_id: number;
  sender_name: string;
  sender_avatar: string;
  is_read: boolean;
  conversationId?: number;
}