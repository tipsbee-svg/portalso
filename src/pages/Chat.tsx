import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types/app.types';
import { Tables } from '../types/database.types';
import Spinner from '../components/ui/Spinner';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Send, ArrowLeft } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

type Message = Tables<'messages'> & { profiles: Profile };
type Conversation = Tables<'conversations'> & {
  conversation_members: { profiles: Profile }[];
  messages: { created_at: string }[];
};

/**
 * A component to render chat message content with basic Markdown parsing.
 * Supports bold (**text** or __text__) and italics (*text* or _text_).
 */
const ChatMessageContent = ({ content }: { content: string }) => {
  const parseMarkdown = (text: string): string => {
    let processedText = text;
    // Process bold first to handle nested cases correctly
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processedText = processedText.replace(/__(.*?)__/g, '<strong>$1</strong>');
    // Process italics
    processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processedText = processedText.replace(/_(.*?)_/g, '<em>$1</em>');
    return processedText;
  };

  const htmlContent = { __html: parseMarkdown(content) };

  // Using dangerouslySetInnerHTML is acceptable here because we are controlling
  // the HTML generation and only inserting simple, safe tags (strong, em).
  return <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={htmlContent} />;
};


const Chat: React.FC = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    if (!profile) return;
    setLoadingConversations(true);
    // Fetch conversations where the current user is a member
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_members!inner(profiles(*)),
        messages(created_at)
      `)
      .order('created_at', { foreignTable: 'messages', ascending: false })
      .limit(1, { foreignTable: 'messages' });

    if (error) {
      console.error('Error fetching conversations:', error);
    } else if (data) {
      // Sort conversations by the most recent message
      const sortedData = data.sort((a, b) => {
        const aDate = a.messages[0]?.created_at;
        const bDate = b.messages[0]?.created_at;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
      setConversations(sortedData as Conversation[]);
    }
    setLoadingConversations(false);
  }, [profile]);

  const fetchMessages = useCallback(async (id: string) => {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as Message[]);
    }
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      
      const channel = supabase
        .channel(`chat:${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          async (payload) => {
            const newMessageId = payload.new.id;
            const { data, error } = await supabase
              .from('messages')
              .select('*, profiles(*)')
              .eq('id', newMessageId)
              .single();

            if (error) {
                console.error('Error fetching new message details:', error);
            } else if (data && data.sender_id !== profile?.id) { // Only add if it's not from the current user to avoid duplicates
                setMessages(currentMessages => [...currentMessages, data as Message]);
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setMessages([]);
    }
  }, [conversationId, fetchMessages, profile?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile || !conversationId) return;
    
    setSending(true);
    const tempId = Date.now();
    const tempMessage: Message = {
        id: tempId,
        body: newMessage.trim(),
        created_at: new Date().toISOString(),
        conversation_id: conversationId,
        sender_id: profile.id,
        metadata: null,
        profiles: profile as Profile // Casting here because we know profile is not null
    };

    // Optimistically update UI
    setMessages(currentMessages => [...currentMessages, tempMessage]);
    setNewMessage('');

    const { data: insertedMessage, error } = await supabase.from('messages').insert({
      body: newMessage.trim(),
      sender_id: profile.id,
      conversation_id: conversationId,
    }).select().single();
    
    if (error) {
      console.error('Error sending message:', error);
      // Revert optimistic update on error
      setMessages(currentMessages => currentMessages.filter(m => m.id !== tempId));
    } else if (insertedMessage) {
        // Replace temp message with actual message from DB
        setMessages(currentMessages => currentMessages.map(m => m.id === tempId ? { ...tempMessage, ...insertedMessage, id: insertedMessage.id } : m));
    }
    setSending(false);
  };
  
  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    const otherMembers = conv.conversation_members.filter(m => m.profiles.id !== profile?.id);
    if (otherMembers.length > 0) {
      return otherMembers.map(m => m.profiles.full_name).join(', ');
    }
    return 'Direct Message';
  };

  const getConversationAvatar = (conv: Conversation) => {
    const otherMembers = conv.conversation_members.filter(m => m.profiles.id !== profile?.id);
    return otherMembers.length === 1 ? otherMembers[0]?.profiles.avatar_url : undefined;
  };

  const currentConversation = conversations.find(c => c.id === conversationId);

  const renderConversationList = () => (
    <div className={`
      w-full lg:w-1/3 xl:w-1/4 bg-white dark:bg-navy-800 border-r border-slate-200 dark:border-navy-700
      flex flex-col h-full ${conversationId ? 'hidden lg:flex' : 'flex'}
    `}>
        <div className="p-4 border-b border-slate-200 dark:border-navy-700">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Chats</h1>
        </div>
        <div className="overflow-y-auto flex-1">
            {loadingConversations ? (
                <div className="flex justify-center items-center h-full"><Spinner /></div>
            ) : (
                <ul>
                    {conversations.map(conv => (
                        <li key={conv.id} onClick={() => navigate(`/chat/${conv.id}`)}
                            className={`p-3 flex items-center space-x-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-700
                                ${conversationId === conv.id ? 'bg-slate-100 dark:bg-navy-900' : ''}`}>
                            <Avatar src={getConversationAvatar(conv)} name={getConversationName(conv)} size="md" />
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold truncate text-slate-800 dark:text-slate-100">{getConversationName(conv)}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">
                                        {conv.messages[0] && formatDistanceToNow(new Date(conv.messages[0].created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                    {/* Placeholder for last message preview */}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
  );
  
  const renderMessageView = () => (
    <div className={`w-full lg:w-2/3 xl:w-3/4 flex flex-col h-full ${conversationId ? 'flex' : 'hidden lg:flex'}`}>
      {!conversationId ? (
        <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-slate-500 dark:text-slate-400">Select a conversation to start chatting.</p>
        </div>
      ) : (
        <>
          <div className="p-3 border-b border-slate-200 dark:border-navy-700 flex items-center space-x-3 bg-white dark:bg-navy-800">
              <button className="lg:hidden text-slate-500 dark:text-slate-400" onClick={() => navigate('/chat')}>
                <ArrowLeft />
              </button>
              {currentConversation && <Avatar src={getConversationAvatar(currentConversation)} name={getConversationName(currentConversation)} size="md" />}
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {currentConversation ? getConversationName(currentConversation) : 'Loading...'}
              </h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-navy-900">
            {loadingMessages ? (
                <div className="flex justify-center items-center h-full"><Spinner /></div>
            ) : (
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender_id !== profile?.id && <Avatar src={msg.profiles.avatar_url} name={msg.profiles.full_name} size="sm" />}
                            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.sender_id === profile?.id
                                ? 'bg-navy-500 text-white' : 'bg-white dark:bg-navy-700'}`}>
                                <p className="font-bold text-sm mb-1">{msg.sender_id === profile?.id ? 'You' : msg.profiles.full_name}</p>
                                <ChatMessageContent content={msg.body} />
                                <p className="text-xs text-right mt-1 opacity-75">{format(new Date(msg.created_at!), 'p')}</p>
                            </div>
                            {msg.sender_id === profile?.id && <Avatar src={msg.profiles.avatar_url} name={msg.profiles.full_name} size="sm" />}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
          </div>
          <div className="p-4 bg-white dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <Input 
                    className="flex-1"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    autoComplete="off"
                  />
                  <Button type="submit" isLoading={sending} disabled={!newMessage.trim() || sending}>
                    <Send className="w-5 h-5" />
                  </Button>
              </form>
          </div>
        </>
      )}
    </div>
  );

  return (
    // This component uses negative margins and a calculated height to create a "full screen" effect
    // within the padded <main> container of the main layout.
    <div className="flex h-[calc(100vh-128px)] lg:h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8">
        {renderConversationList()}
        {renderMessageView()}
    </div>
  );
};

export default Chat;