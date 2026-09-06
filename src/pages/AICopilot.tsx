import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Zap, Activity, Users, ShieldAlert, Car, AlertTriangle, 
  ChevronRight, Play, CheckCircle2, TrendingUp, Info, ActivitySquare 
} from 'lucide-react';
import { AI_CHAT_MESSAGES, AI_SUGGESTED_ACTIONS } from '@/lib/data';
import { cn } from '@/lib/utils';
import { showToast } from '@/components/ui/Toast';

// --- Custom AI Components ---

const SimulationCard = ({ title, content }: { title: string, content: string }) => {
  return (
    <div className="my-4 border border-primary/30 bg-primary/5 rounded-xl overflow-hidden relative shadow-[0_0_15px_rgba(249,115,22,0.05)]">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ActivitySquare className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{title.replace(/\*\*/g, '')}</span>
        </div>
        <span className="text-[9px] text-primary/70 font-mono">Foundry_Sim_Engine_v4</span>
      </div>
      <div className="p-4 text-sm text-slate-700">
        <div dangerouslySetInnerHTML={{ __html: content }} className="space-y-3" />
      </div>
    </div>
  );
};

const ActionList = ({ actions }: { actions: string[] }) => (
  <div className="my-3 space-y-2">
    {actions.map((act, i) => (
      <div key={i} className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group">
        <div className="flex items-start gap-3 pr-4">
          <CheckCircle2 className="w-4 h-4 text-secondary group-hover:text-primary transition-colors shrink-0 mt-0.5" />
          <span className="text-sm text-text leading-tight">{act.replace(/^\d+\.\s*/, '')}</span>
        </div>
        <button 
          onClick={() => showToast('Action queued for execution', 'success')}
          className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-1"
        >
          Execute <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    ))}
  </div>
);

const RiskScores = ({ text }: { text: string }) => {
  const parts = text.replace('**Predicted Risk Score:**', '').trim().split('·').map(p => p.trim());
  return (
    <div className="flex flex-wrap gap-3 my-4 p-3 bg-surface/50 border border-border/50 rounded-xl">
      <div className="w-full text-[10px] text-secondary uppercase font-bold mb-1 flex items-center gap-1">
        <ShieldAlert className="w-3 h-3" /> AI Risk Assessment
      </div>
      {parts.map((p, i) => {
        const [name, scoreStr] = p.split(' ');
        const score = parseFloat(scoreStr);
        let colorClass = 'bg-green-500/20 text-green-400 border-green-500/30';
        if (score > 4) colorClass = 'bg-warning/20 text-warning border-warning/30';
        if (score > 7) colorClass = 'bg-critical/20 text-critical border-critical/30';
        
        return (
          <div key={i} className="flex flex-col gap-1 bg-card border border-border px-3 py-2 rounded-lg flex-1 min-w-[100px]">
            <span className="text-xs text-secondary font-medium">{name}</span>
            <div className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded border inline-block w-fit", colorClass)}>
              {scoreStr}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Parser ---

const parseTable = (block: string) => {
  const rows = block.trim().split('\n');
  const headerRow = rows[0].split('|').filter(Boolean).map(c => c.trim());
  const dataRows = rows.slice(2).map(r => r.split('|').filter(Boolean).map(c => c.trim()));
  
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-surface text-secondary text-[10px] uppercase tracking-wider font-semibold">
          <tr>
            {headerRow.map((h, j) => <th key={j} className="px-4 py-3 border-b border-border">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {dataRows.map((row, j) => (
            <tr key={j} className="bg-card hover:bg-surface/50 transition-colors">
              {row.map((cell, k) => {
                let cellClass = "px-4 py-3";
                if (cell.includes('⚠') || cell.includes('Critical')) cellClass = cn(cellClass, "text-critical font-semibold");
                else if (cell.includes('High')) cellClass = cn(cellClass, "text-orange-400 font-semibold");
                else if (cell.includes('Medium')) cellClass = cn(cellClass, "text-warning font-semibold");
                else if (cell.includes('Low')) cellClass = cn(cellClass, "text-green-400 font-semibold");
                return <td key={k} className={cellClass} dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*/g, '<strong>').replace(/<\/strong><strong>/g, '') }} />
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderMessageContent = (content: string) => {
  // We'll do a slightly complex block split to handle Special sections
  
  if (content.includes('**Simulation:')) {
    const simTitleMatch = content.match(/(\*\*Simulation:[^\n]+)/);
    const title = simTitleMatch ? simTitleMatch[0] : 'Simulation Results';
    
    // We will just render the whole block inside the SimulationCard for this mock, 
    // replacing tables with HTML tables for simplicity inside the card.
    let htmlContent = content.replace(title, '').trim();
    
    // Convert markdown table to HTML table string for inner injection
    const tableRegex = /\|(.+)\n\|[-|]+\n((?:\|.+\n?)+)/g;
    htmlContent = htmlContent.replace(tableRegex, (match) => {
      // Very basic HTML table converter for inner html
      const rows = match.trim().split('\n');
      const hRow = rows[0].split('|').filter(Boolean).map(c => `<th>${c.trim()}</th>`).join('');
      const dRows = rows.slice(2).map(r => `<tr>${r.split('|').filter(Boolean).map(c => {
        const txt = c.trim();
        let cls = '';
        if (txt.includes('Critical') || txt.includes('⚠')) cls='color: #ef4444; font-weight: bold;';
        return `<td style="${cls}">${txt}</td>`;
      }).join('')}</tr>`).join('');
      
      return `<div style="overflow-x:auto; margin: 12px 0; border: 1px solid #e5e7eb; border-radius: 8px;">
                <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 13px;">
                  <thead style="background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #64748b;"><tr>${hRow}</tr></thead>
                  <tbody>${dRows}</tbody>
                </table>
              </div>`;
    });

    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0E1A2B;">$1</strong>');
    htmlContent = htmlContent.replace(/⚠/g, '<span style="color: #ef4444;">⚠</span>');
    htmlContent = htmlContent.replace(/\n/g, '<br/>');

    return <SimulationCard title={title} content={htmlContent} />;
  }

  const blocks = content.split('\n\n');
  const renderedBlocks: React.ReactNode[] = [];
  
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    
    if (block.trim().startsWith('|')) {
      renderedBlocks.push(<div key={i}>{parseTable(block)}</div>);
    } 
    else if (block.includes('**Recommended Actions:**') || block.includes('**Volunteer Deployment Plan:**')) {
      const header = block.split('\n')[0];
      const listItems = block.split('\n').slice(1).filter(l => l.trim().match(/^\d+\.|^-/));
      
      renderedBlocks.push(
        <div key={i} className="my-4">
          <h4 className="text-xs font-bold text-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary" />
            {header.replace(/\*\*/g, '')}
          </h4>
          <ActionList actions={listItems} />
        </div>
      );
    }
    else if (block.includes('**Predicted Risk Score:**')) {
      renderedBlocks.push(<RiskScores key={i} text={block} />);
    }
    else if (block.trim().startsWith('⚠')) {
      renderedBlocks.push(
        <div key={i} className="my-3 p-3 bg-warning/10 border border-warning/30 rounded-lg flex gap-3 items-start text-warning text-sm shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: block.substring(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0E1A2B]">$1</strong>') }} />
        </div>
      );
    }
    else {
      // Regular text
      const pParsed = block.split(/(\*\*.*?\*\*)/g).map((part, k) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={k} className="text-text font-semibold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      renderedBlocks.push(<p key={i} className="mb-3 text-sm leading-relaxed text-slate-700">{pParsed}</p>);
    }
    i++;
  }
  
  return <>{renderedBlocks}</>;
};


export default function AICopilot() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<any[]>(AI_CHAT_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    const newUserMsg = {
      role: 'user' as const,
      sender: 'user',
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("API key not configured");
      }

      // Convert history for API
      const apiMessages = messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));
      apiMessages.push({ role: 'user', content: userMessage });

      // Add system prompt context
      apiMessages.unshift({
        role: 'system',
        content: 'You are YatraFlow AI, a specialized Command Center assistant for Temple Crowd Management. Provide concise, operational responses. Use formatting like **bold** for emphasis, ⚠ for alerts, and markdown tables for tabular data if applicable.'
      });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: apiMessages,
          temperature: 0.3,
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponseContent = data.choices[0].message.content;

      const newAiMsg = {
        role: 'ai' as const,
        sender: 'ai',
        content: aiResponseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg = {
        role: 'ai' as const,
        sender: 'ai',
        content: `⚠ **Connection Error**\nUnable to reach AI subsystem. Please verify your connection and API key configuration.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const capabilities = [
    { name: 'Crowd Prediction', icon: Users },
    { name: 'Queue Optimization', icon: Activity },
    { name: 'Resource Deployment', icon: Zap },
    { name: 'Risk Assessment', icon: ShieldAlert },
    { name: 'Emergency Simulation', icon: AlertTriangle },
    { name: 'Traffic Analysis', icon: Car },
  ];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6"
    >
      {/* Sidebar - Operations Context */}
      <div className="md:w-[320px] shrink-0 flex flex-col gap-6 h-full">
        <div className="card-base p-0 flex-1 flex flex-col overflow-hidden border-primary/20 shadow-[0_0_20px_rgba(249,115,22,0.05)] dark:bg-[#121E33] dark:border-slate-800">
          <div className="p-5 border-b border-border dark:border-slate-800 bg-surface/50 dark:bg-[#121E33]/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary relative border border-primary/30 shadow-inner">
                <Bot className="w-7 h-7" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0E1A2B] dark:text-white flex items-center gap-2">
                  YatraFlow AI
                </h2>
                <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                  <span className="text-primary font-bold">ONLINE</span>
                  <span className="text-secondary dark:text-slate-400">• Copilot v3.1</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="mb-8">
              <h3 className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Intelligence Feeds
              </h3>
              <div className="space-y-2">
                {AI_SUGGESTED_ACTIONS.slice(0, 4).map((action, i) => (
                  <button 
                    key={i} 
                    onClick={() => setInputValue(action.title)}
                    className="w-full text-left text-[13px] text-secondary hover:text-primary px-3 py-2.5 rounded-lg border border-border/50 hover:border-primary/40 bg-surface/30 hover:bg-primary/5 transition-all truncate flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    {action.title}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-3">Model Capabilities</h3>
              <div className="grid grid-cols-2 gap-2">
                {capabilities.map((cap, i) => {
                  const Icon = cap.icon;
                  return (
                    <div key={i} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-surface/40 border border-border/50 text-center hover:bg-surface transition-colors cursor-help">
                      <Icon className="w-5 h-5 text-secondary" />
                      <span className="text-[10px] text-text font-medium leading-tight">{cap.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-surface/80 border-t border-border text-[10px] text-secondary/70 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <p>AI decisions are probabilistic. Execute high-risk actions only after manual verification.</p>
          </div>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 card-base flex flex-col overflow-hidden relative h-full dark:bg-[#121E33] dark:border-slate-800">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth">
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              className={cn(
                "flex flex-col max-w-[90%]",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              {msg.role === 'ai' && (
                <div className="flex items-center gap-2 mb-2 ml-1">
                  <div className="bg-primary/20 p-1 rounded">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-text dark:text-white tracking-wide">YatraFlow AI</span>
                  <span className="text-[10px] text-secondary dark:text-slate-400 font-mono ml-2">{msg.timestamp}</span>
                </div>
              )}
              {msg.role === 'user' && (
                <div className="flex items-center justify-end gap-2 mb-2 mr-1">
                  <span className="text-[10px] text-secondary dark:text-slate-400 font-mono mr-2">{msg.timestamp}</span>
                  <span className="text-xs font-bold text-text dark:text-white tracking-wide">Command Center</span>
                </div>
              )}
              
              <div className={cn(
                "p-5 rounded-2xl shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-white rounded-tr-sm" 
                  : "bg-surface/80 dark:bg-[#1E293B]/80 border border-border/80 dark:border-slate-700/80 rounded-tl-sm w-full"
              )}>
                {msg.role === 'user' ? (
                  <p className="text-[15px] font-medium tracking-wide">{msg.content}</p>
                ) : (
                  <div className="ai-content-renderer dark:text-slate-200">
                    {renderMessageContent(msg.content)}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col max-w-[90%] mr-auto items-start"
            >
              <div className="flex items-center gap-2 mb-2 ml-1">
                <div className="bg-primary/20 p-1 rounded">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-text dark:text-white tracking-wide">YatraFlow AI</span>
              </div>
              <div className="p-5 bg-surface/80 dark:bg-[#1E293B]/80 border border-border/80 dark:border-slate-700/80 rounded-2xl rounded-tl-sm flex items-center gap-1.5 h-14">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="p-5 border-t border-border dark:border-slate-800 bg-card/90 dark:bg-[#121E33]/90 backdrop-blur-md z-10">
          <div className="relative flex items-center group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Query YatraFlow intelligence or request a simulation..." 
              className="w-full relative bg-surface dark:bg-[#0B1221] border border-border/80 dark:border-slate-700 rounded-xl pl-5 pr-14 py-4 text-[15px] text-text dark:text-white placeholder:text-secondary dark:placeholder:text-slate-500 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60 shadow-inner transition-all"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 p-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-md group-focus-within:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
