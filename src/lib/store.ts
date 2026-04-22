import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  provider: string;
  createdAt: number;
}

export const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq',
    url: 'https://console.groq.com',
    keyPlaceholder: 'gsk_...',
    description: 'Быстрый и бесплатный. Регистрация на console.groq.com',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    url: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-...',
    description: 'Бесплатные модели без карты. Регистрация на openrouter.ai',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    url: 'https://aistudio.google.com/apikey',
    keyPlaceholder: 'AIza...',
    description: 'Бесплатный Gemini 2.5 Flash. Ключ на aistudio.google.com',
  },
];

export const MODELS_BY_PROVIDER: Record<string, { id: string; label: string }[]> = {
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B — лучший для кода' },
    { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 70B — глубокое мышление' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B — быстрый и умный' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B — самый быстрый' },
  ],
  openrouter: [
    { id: 'deepseek/deepseek-v3-0324:free', label: 'DeepSeek V3 — топ для кода (бесплатно)' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (бесплатно)' },
    { id: 'google/gemma-3-27b-it:free', label: 'Gemma 3 27B (бесплатно)' },
    { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B — быстрый (бесплатно)' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash — лучший бесплатный' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash — быстрый' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro — мощный' },
  ],
};

interface AppState {
  provider: string;
  apiKeys: Record<string, string>;
  setProvider: (provider: string) => void;
  setApiKey: (provider: string, key: string) => void;

  conversations: Conversation[];
  activeConversationId: string | null;
  activeModel: string;

  setActiveModel: (model: string) => void;
  setActiveConversation: (id: string) => void;

  createConversation: () => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      provider: 'groq',
      apiKeys: {},
      setProvider: (provider) => {
        const models = MODELS_BY_PROVIDER[provider] || [];
        set({ provider, activeModel: models[0]?.id || '' });
      },
      setApiKey: (provider, key) =>
        set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),

      conversations: [],
      activeConversationId: null,
      activeModel: 'llama-3.3-70b-versatile',

      setActiveModel: (model) => set({ activeModel: model }),
      setActiveConversation: (id) => set({ activeConversationId: id }),

      createConversation: () => {
        const id = crypto.randomUUID();
        const state = get();
        const newConversation: Conversation = {
          id,
          title: 'Новый чат',
          messages: [],
          model: state.activeModel,
          provider: state.provider,
          createdAt: Date.now(),
        };
        set((s) => ({
          conversations: [newConversation, ...s.conversations],
          activeConversationId: id,
        }));
      },

      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              let title = conv.title;
              if (conv.messages.length === 0 && message.role === 'user') {
                title = message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '');
              }
              return { ...conv, title, messages: [...conv.messages, message] };
            }
            return conv;
          }),
        })),

      updateConversationTitle: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, title } : conv
          ),
        })),

      deleteConversation: (id) =>
        set((state) => {
          const newConversations = state.conversations.filter((c) => c.id !== id);
          return {
            conversations: newConversations,
            activeConversationId:
              state.activeConversationId === id
                ? newConversations[0]?.id || null
                : state.activeConversationId,
          };
        }),

      clearHistory: () => set({ conversations: [], activeConversationId: null }),
    }),
    { name: 'novamind-storage' }
  )
);
