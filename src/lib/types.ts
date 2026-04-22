import { create } from 'zustand';

interface AppState {
  apiKey: string;
  setApiKey: (key: string) => void;
  
  conversations: any[];
  activeConversationId: string | null;
  activeModel: string;
  
  setActiveModel: (model: string) => void;
  setActiveConversation: (id: string) => void;
  
  createConversation: () => void;
  addMessage: (conversationId: string, message: any) => void;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearHistory: () => void;
}
