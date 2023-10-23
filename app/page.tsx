'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";  // Ensure this path is correct
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";

const createIndexAndEmbeddings = async () => {
  try {
    const result = await fetch('/api/setup', {
      method: "POST"
    });
    const json = await result.json();
    console.log('result: ', json);
  } catch (err) {
    console.log('err:', err);
  }
};

// NavMenu component for the navigation menu
function NavMenu() {
  return (
    <NavigationMenu className="flex justify-center w-full">
      <NavigationMenuList className="flex items-center space-x-4">
        <NavigationMenuItem>
          <a onClick={createIndexAndEmbeddings} className="navigation-menu-link cursor-pointer">Index</a>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export { NavMenu };

// TextareaWithButton component for typing and sending messages
export function TextareaWithButton({ onSendMessage }: { onSendMessage: (message: string) => void }) {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="grid w-full gap-2 px-4 md:px-0">
      <textarea 
        id="prompt-textarea" 
        tabIndex={0} 
        rows={1} 
        placeholder="Send a message" 
        className="m-0 w-full resize-none border-0 bg-transparent py-[10px] pr-10 focus:ring-0 focus-visible:ring-0 dark:bg-transparent md:py-4 md:pr-12 gizmo:md:py-3.5 pl-3 md:pl-4"
        style={{ maxHeight: '200px', height: '56px', overflowY: 'hidden' }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button onClick={handleSendMessage}>Send</Button>
    </div>
  );
}

type ChatAreaProps = {
  messages: Message[];
};

// ChatArea component for displaying messages
function ChatArea({ messages }: ChatAreaProps) {
  return (
    <div className="chat-area">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.type}`}>
          {message.content}
        </div>
      ))}
    </div>
  );
}
type Message = { type: 'user' | 'llm', content: string };

// ChatPage component which includes ChatArea and TextareaWithButton
function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    setMessages(prevMessages => [...prevMessages, { type: 'user', content: message }]);
    setLoading(true);
    
    try {
      const result = await fetch('/api/read', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',  // Ensure the content type is set to JSON
        },
        body: JSON.stringify({ question: message })  // Encapsulate message in an object with a 'question' property
      })
      const json = await result.json();
      console.log('Response JSON:', JSON.stringify(json, null, 2));  // Log the entire response JSON
      console.log('Response Data:', json.data);  // Log just the data property of the response JSON
      setMessages(prevMessages => [...prevMessages, { type: 'llm', content: json.data }]);
      setLoading(false);
    } catch (err) {
      console.log('err:', err);
      setLoading(false);
    }
  };

  


  return (
    <div className="chat-page w-full md:w-[80%] lg:w-[60%]">
      <ChatArea messages={messages} />
      <TextareaWithButton onSendMessage={handleSendMessage} />
      {loading && <p>Asking AI ...</p>}
      
    </div>
  );
}

// Your existing Home component
export default function Home() {
  return (
    <main className="flex flex-col min-h-screen justify-between p-24">
      <header className="w-full flex justify-center">
        <NavMenu />
      </header>
      <div className="flex-grow flex flex-col items-center justify-center">
        <ChatPage />
      </div>
    </main>
  );
}