import { useState, useRef, useEffect } from 'react';
import { useAppStore, MODELS_BY_PROVIDER, PROVIDERS } from '@/lib/store';
import { sendMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Bot,
  User,
  Send,
  Settings,
  Plus,
  Menu,
  MessageSquare,
  Trash2,
  Loader2,
  KeyRound,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { provider, apiKeys, setProvider, setApiKey } = useAppStore();
  const [selectedProvider, setSelectedProvider] = useState(provider);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>(apiKeys);
  const { toast } = useToast();

  const currentProviderInfo = PROVIDERS.find((p) => p.id === selectedProvider)!;

  const handleSave = () => {
    setProvider(selectedProvider);
    Object.entries(keyInputs).forEach(([prov, key]) => {
      if (key) setApiKey(prov, key);
    });
    onOpenChange(false);
    toast({ title: 'Настройки сохранены', description: 'Ключ API сохранён в браузере.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Настройки API
          </DialogTitle>
          <DialogDescription>
            Выберите провайдера и введите API ключ. Все ключи бесплатны.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Провайдер</Label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={cn(
                    'rounded-lg border p-3 text-left text-sm transition-all',
                    selectedProvider === p.id
                      ? 'border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary'
                      : 'border-border hover:border-primary/40 hover:bg-accent/50'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            {currentProviderInfo.description}
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">
              API ключ для {currentProviderInfo.name}
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder={currentProviderInfo.keyPlaceholder}
              value={keyInputs[selectedProvider] || ''}
              onChange={(e) =>
                setKeyInputs((prev) => ({ ...prev, [selectedProvider]: e.target.value }))
              }
            />
            <a
              href={currentProviderInfo.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              Получить бесплатный ключ
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-xs text-muted-foreground">
              Ключ хранится только в вашем браузере и нигде не передаётся.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WelcomeScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <Bot className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-3 tracking-tight">Добро пожаловать в NovaMind</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-4 leading-relaxed">
        Профессиональный AI-чат для программирования и не только. Подключите бесплатный API ключ
        и начните работать.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8 text-sm text-left max-w-lg w-full">
        {PROVIDERS.map((p) => (
          <div key={p.id} className="rounded-lg border border-border p-3 space-y-1">
            <div className="font-semibold">{p.name}</div>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Получить ключ
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onOpenSettings} className="gap-2 text-base px-8 h-12">
        <KeyRound className="w-5 h-5" />
        Настроить API ключ
      </Button>
    </div>
  );
}

function MessageBubble({ message }: { message: { role: string; content: string } }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full gap-4 p-6',
        isUser ? 'bg-transparent' : 'bg-card border-y border-border/50'
      )}
    >
      <div className="flex-shrink-0">
        <Avatar className="w-8 h-8 border border-border/50 shadow-sm">
          {isUser ? (
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="w-4 h-4" />
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      <div className="flex-1 max-w-3xl min-w-0 prose prose-slate dark:prose-invert">
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md border border-border/50 text-sm overflow-hidden my-4"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    {...props}
                    className={cn(
                      'bg-muted px-1.5 py-0.5 rounded-sm text-sm font-mono text-muted-foreground',
                      className
                    )}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const {
    provider,
    apiKeys,
    conversations,
    activeConversationId,
    activeModel,
    setActiveModel,
    setActiveConversation,
    createConversation,
    addMessage,
    deleteConversation,
    clearHistory,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentApiKey = apiKeys[provider] || '';
  const currentModels = MODELS_BY_PROVIDER[provider] || [];
  const currentProviderInfo = PROVIDERS.find((p) => p.id === provider);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, isLoading]);

  const handleSubmit = async () => {
    if (!input.trim() || !currentApiKey) return;

    let convId = activeConversationId;
    if (!convId) {
      createConversation();
      setTimeout(handleSubmit, 50);
      return;
    }

    const userMessage = {
      role: 'user' as const,
      content: input.trim(),
      timestamp: Date.now(),
    };

    addMessage(convId, userMessage);
    setInput('');
    setIsLoading(true);

    const conv = useAppStore.getState().conversations.find((c) => c.id === convId);
    if (!conv) return;

    try {
      const response = await sendMessage(provider, currentApiKey, activeModel, conv.messages);
      addMessage(convId, {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось получить ответ от API',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!currentApiKey) {
    return (
      <>
        <WelcomeScreen onOpenSettings={() => setSettingsOpen(true)} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="w-72 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-semibold tracking-tight text-sidebar-foreground flex-1">
              NovaMind
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4">
            <Button
              onClick={() => createConversation()}
              className="w-full justify-start gap-2 h-10 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Новый чат
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1 pb-4">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-md cursor-pointer group hover:bg-sidebar-accent transition-colors',
                    activeConversationId === conv.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80'
                  )}
                  onClick={() => setActiveConversation(conv.id)}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate text-sm font-medium">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-10 text-muted-foreground"
              onClick={() => clearHistory()}
            >
              <Trash2 className="w-4 h-4" />
              Очистить историю
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-10 text-sidebar-foreground"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
              Настройки
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <Select value={activeModel} onValueChange={setActiveModel}>
              <SelectTrigger className="w-[300px] h-9 border-none bg-transparent shadow-none hover:bg-accent focus:ring-0">
                <SelectValue placeholder="Выбрать модель" />
              </SelectTrigger>
              <SelectContent>
                {currentModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground h-8"
            onClick={() => setSettingsOpen(true)}
          >
            <span className="font-medium">{currentProviderInfo?.name}</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Bot className="w-8 h-8 text-primary/50" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Чем могу помочь?</h2>
                <p className="text-muted-foreground">
                  Выберите модель и начните общаться. Задавайте вопросы по коду, дизайну или
                  чему угодно.
                </p>
              </div>
            </div>
          ) : (
            <div className="pb-8">
              {activeConversation.messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {isLoading && (
                <div className="flex w-full gap-4 p-6 bg-card border-y border-border/50">
                  <div className="flex-shrink-0">
                    <Avatar className="w-8 h-8 border border-border/50 shadow-sm">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
          <div className="max-w-3xl mx-auto relative flex items-end shadow-sm border border-input bg-background rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-primary transition-shadow">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение... (Enter — отправить, Shift+Enter — новая строка)"
              className="min-h-[60px] max-h-[200px] w-full resize-none border-0 focus-visible:ring-0 px-4 py-4 bg-transparent"
              rows={1}
            />
            <div className="p-2 flex-shrink-0">
              <Button
                size="icon"
                className="h-10 w-10 rounded-lg transition-transform hover:scale-105"
                disabled={!input.trim() || isLoading}
                onClick={handleSubmit}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
              {currentProviderInfo?.name}
            </span>
          </div>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
