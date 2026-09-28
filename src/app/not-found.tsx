"use client";

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { generateKeyPair, exportPublicKey, encryptMessage, decryptMessage, visualCipher, exportPrivateKey, importPrivateKey, importPublicKey } from '@/lib/crypto';
import { deriveJackalKey, getJackalDropId, encryptJackalMessage, decryptJackalMessage } from '@/lib/jackal_crypto';
import { KeyRound, Send, Shield, Copy, UserPlus, Trash2, Smartphone, QrCode, Paperclip, Edit3, UserX, Eraser, Ghost, Settings } from 'lucide-react';
import QRCode from 'react-qr-code';
import QRScanner from '../components/QRScanner';

type ChatMessage = {
  sender: string;
  text?: string;
  file?: { name: string; mime: string; data: string; };
  timestamp?: number;
};

type ContactInfo = {
  alias: string;
  type: 'standard' | 'jackal';
  passphrase?: string;
};

const playNotificationSound = () => {
  try {
    const audio = new Audio('/notif.mp3');
    // -20dB = Math.pow(10, -20 / 20) = 0.1
    audio.volume = 0.1;
    audio.play().catch(() => {});
  } catch (e) {
    // Silencia qualquer erro de permissão de autoplay do navegador
  }
};

const MessageBubble = ({ msg, isMe }: { msg: ChatMessage, isMe: boolean }) => {
  const [displayed, setDisplayed] = useState(isMe ? msg.text : visualCipher.encode(msg.text || ''));
  const [isAnimating, setIsAnimating] = useState(!isMe && !!msg.text);

  useEffect(() => {
    if (isMe || !msg.text) return;

    let iterations = 0;
    const maxIterations = 40;
    const encoded = visualCipher.encode(msg.text);
    
    const interval = setInterval(() => {
      iterations++;
      if (iterations >= maxIterations) {
        setDisplayed(msg.text);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayed(
          msg.text.split('').map((char, i) => {
            const revealThreshold = (i / msg.text!.length) * maxIterations;
            if (iterations > revealThreshold) return char;
            const isCipher = Math.random() > 0.3;
            return isCipher ? encoded[i] : '!@#$%^&*()[];.,~='[Math.floor(Math.random() * 17)];
          }).join('')
        );
      }
    }, 50);

    return () => clearInterval(interval);
  }, [msg.text, isMe]);

  let coordMatch = null;
  if (msg.text && !isAnimating) {
    coordMatch = msg.text.match(/(-?\d{1,2}\.\d{4,})\s*,\s*(-?\d{1,3}\.\d{4,})/);
  }

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4`}>
      <div 
        className={`max-w-[85%] p-4 text-sm transition-all duration-500 rounded-2xl ${
          isMe 
            ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' 
            : isAnimating 
              ? 'bg-zinc-800 text-zinc-400 rounded-tl-sm font-mono' 
              : 'bg-[#5b32f5] text-white rounded-tl-sm shadow-[0_0_15px_rgba(91,50,245,0.4)]'
        }`}
      >
        {msg.text && (
          <div className="flex flex-col gap-2">
            <span className="leading-relaxed">{displayed}</span>
            {coordMatch && (
              <div className="w-full mt-2 border border-black/20 rounded overflow-hidden">
                <iframe 
                  width="100%" height="150" src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(coordMatch[2])-0.01}%2C${parseFloat(coordMatch[1])-0.01}%2C${parseFloat(coordMatch[2])+0.01}%2C${parseFloat(coordMatch[1])+0.01}&layer=mapnik&marker=${coordMatch[1]}%2C${coordMatch[2]}`}
                  style={{ filter: "invert(90%) hue-rotate(180deg) contrast(120%)" }}
                ></iframe>
                <div className="bg-black/40 p-1 text-[10px] text-white/50 text-center uppercase tracking-widest">Satelite Secundário (OSM)</div>
              </div>
            )}
          </div>
        )}
        {msg.file && (
          <div className="flex flex-col gap-2 mt-2">
            {msg.file.mime.startsWith('image/') ? (
              <img src={msg.file.data} alt={msg.file.name} className="max-w-full max-h-64 rounded-lg border border-white/10" />
            ) : (
              <div className="flex items-center gap-2 bg-black/20 p-3 rounded-lg">
                <Paperclip size={16} />
                <span className="truncate max-w-[200px] text-xs font-semibold">{msg.file.name}</span>
              </div>
            )}
            <a href={msg.file.data} download={msg.file.name} className={`text-xs hover:underline ${isMe ? 'text-purple-400' : 'text-white/80'}`}>Baixar Arquivo Seguro</a>
          </div>
        )}
        
        <div className={`text-[10px] mt-2 text-right opacity-50 flex items-center justify-end gap-1 ${isAnimating ? 'invisible' : ''}`}>
          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          {isMe && <span>✓✓</span>}
        </div>
      </div>
    </div>
  );
};

export default function ChatApp() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myKeys, setMyKeys] = useState<{ private: CryptoKey, public: CryptoKey } | null>(null);
  const [myId, setMyId] = useState<string>('');
  
  // Contatos agora com suporte ao modo Chacal
  const [contacts, setContacts] = useState<Record<string, ContactInfo>>({});
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const activeContactRef = useRef<string | null>(null);
  const [newContactId, setNewContactId] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  // Atualizar a ref sempre que activeContact mudar
  useEffect(() => {
    activeContactRef.current = activeContact;
    if (activeContact) {
      // Zera o contador do contato ativo
      setUnreadCounts(prev => ({ ...prev, [activeContact]: 0 }));
    }
  }, [activeContact]);
  
  // Modais customizados
  const [activeModal, setActiveModal] = useState<'jackal' | 'edit_alias' | 'delete_contact' | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [modalTargetContact, setModalTargetContact] = useState<string | null>(null);
  
  // Estrutura de mensagens
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncQRData, setSyncQRData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Configurações Globais
  const [username, setUsername] = useState('Unknown');
  const [receiveMessages, setReceiveMessages] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const settingsRef = useRef({ receiveMessages: true, notificationsEnabled: true });
  useEffect(() => {
    settingsRef.current = { receiveMessages, notificationsEnabled };
  }, [receiveMessages, notificationsEnabled]);

  // Estado de Disfarce (Decoy)
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Listener para a "senha invisível"
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') {
        setIsUnlocked(true);
      }
      if (e.key === 'Escape') {
        setIsUnlocked(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const formatId = (id: string) => id.substring(0, 8) + '...';

  // Carregar dados salvos e limpar expirados (24h)
  useEffect(() => {
    const savedContacts = localStorage.getItem('refugio_contacts');
    if (savedContacts) {
      const parsed = JSON.parse(savedContacts);
      const migrated: Record<string, ContactInfo> = {};
      for (const key in parsed) {
        if (typeof parsed[key] === 'string') {
          migrated[key] = { alias: parsed[key], type: 'standard' };
        } else {
          migrated[key] = parsed[key];
        }
      }
      setContacts(migrated);
    }

    const savedMessages = localStorage.getItem('refugio_messages');
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      const filtered: Record<string, ChatMessage[]> = {};
      for (const contactId in parsed) {
        filtered[contactId] = parsed[contactId].filter((msg: ChatMessage) => {
          if (!msg.timestamp) return true;
          return (now - msg.timestamp) < twentyFourHours;
        });
      }
      setMessages(filtered);
    }
  }, []);

  // Timer para apagar mensagens em tempo real se passar 24h com a aba aberta
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      let hasChanges = false;
      
      setMessages(prev => {
        const next = { ...prev };
        for (const contactId in next) {
          const originalLen = next[contactId].length;
          next[contactId] = next[contactId].filter(msg => {
            if (!msg.timestamp) return true;
            return (now - msg.timestamp) < twentyFourHours;
          });
          if (next[contactId].length !== originalLen) hasChanges = true;
        }
        return hasChanges ? next : prev;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Salvar contatos
  useEffect(() => {
    if (Object.keys(contacts).length > 0) {
      localStorage.setItem('refugio_contacts', JSON.stringify(contacts));
    }
  }, [contacts]);

  // Salvar mensagens (com try/catch pois arquivos grandes podem estourar o limite de 5MB do localStorage)
  useEffect(() => {
    if (Object.keys(messages).length > 0) {
      try {
        localStorage.setItem('refugio_messages', JSON.stringify(messages));
      } catch (e) {
        console.warn("Limite do localStorage atingido, algumas mensagens com arquivos grandes não serão salvas.");
      }
    }
  }, [messages]);

  // Carregar e salvar configurações globais
  useEffect(() => {
    const savedUsername = localStorage.getItem('refugio_username');
    const savedReceive = localStorage.getItem('refugio_receive_msgs');
    const savedNotifs = localStorage.getItem('refugio_notifs');
    if (savedUsername) setUsername(savedUsername);
    if (savedReceive !== null) setReceiveMessages(savedReceive === 'true');
    if (savedNotifs !== null) setNotificationsEnabled(savedNotifs === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('refugio_username', username);
    localStorage.setItem('refugio_receive_msgs', receiveMessages.toString());
    localStorage.setItem('refugio_notifs', notificationsEnabled.toString());
  }, [username, receiveMessages, notificationsEnabled]);

  // Inicialização
  useEffect(() => {
    let newSocket: Socket | null = null;
    async function init() {
      let keys;
      let pubKeyBase64;
      
      const savedPriv = localStorage.getItem('refugio_priv');
      const savedPub = localStorage.getItem('refugio_pub');
      
      if (savedPriv && savedPub) {
        const privateKey = await importPrivateKey(savedPriv);
        const publicKey = await importPublicKey(savedPub);
        keys = { privateKey, publicKey };
        pubKeyBase64 = savedPub;
      } else {
        keys = await generateKeyPair();
        pubKeyBase64 = await exportPublicKey(keys.publicKey);
        const privBase64 = await exportPrivateKey(keys.privateKey);
        
        localStorage.setItem('refugio_priv', privBase64);
        localStorage.setItem('refugio_pub', pubKeyBase64);
      }

      setMyKeys({ private: keys.privateKey, public: keys.publicKey });
      setMyId(pubKeyBase64);

      newSocket = io('http://localhost:4000');
      newSocket.on('connect', () => {
        newSocket.emit('register', pubKeyBase64);
      });

      // Eventos de Sincronização
      newSocket.on('sync_code_generated', (code) => {
        setSyncCode(code);
      });

      newSocket.on('sync_device_receive', async (data) => {
        try {
          const importedPrivate = await importPrivateKey(data.exportedPrivateKey);
          const importedPublic = await importPublicKey(data.exportedPublicKey);
          const pubKeyBase64 = await exportPublicKey(importedPublic);
          
          setMyKeys({ private: importedPrivate, public: importedPublic });
          setMyId(pubKeyBase64);
          
          localStorage.setItem('refugio_priv', data.exportedPrivateKey);
          localStorage.setItem('refugio_pub', pubKeyBase64);
          
          newSocket!.emit('register', pubKeyBase64);
          setShowSyncModal(false);
          alert('Identidade Sincronizada com Sucesso! Este dispositivo agora é o mesmo Agente.');
        } catch(e) {
          console.error(e);
          alert('Erro ao importar chaves.');
        }
      });

      newSocket.on('sync_success', () => {
        alert('Dispositivo pareado com sucesso!');
        setShowSyncModal(false);
      });

      setSocket(newSocket);
    }
    init();

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []); // Atenção: não recriar socket ao mudar chaves aqui. (Um hack rápido para PoC).
  // Na verdade, as funções dentro do useEffect fecham as variáveis da primeira renderização.
  // Para atualizar o decryptMessage com as chaves corretas após o sync, precisamos usar Refs ou re-conectar.

  const currentKeys = useRef(myKeys);
  useEffect(() => { currentKeys.current = myKeys; }, [myKeys]);

  // Atualizando o listener de mensagens para sempre usar as chaves mais recentes
  useEffect(() => {
    if (!socket) return;
    
    const handleReceive = async (data: { fromCode: string, encryptedPayload: string }) => {
      if (!settingsRef.current.receiveMessages) return; // Se estiver bloqueado nas configurações, ignora silenciosamente
      if (!currentKeys.current) return;
      try {
        const decryptedCode = await decryptMessage(data.encryptedPayload, currentKeys.current.private, data.fromCode);
        
        let newMsg: ChatMessage;
        try {
          const parsed = JSON.parse(decryptedCode);
          if (parsed.type === 'file') {
            newMsg = { sender: data.fromCode, file: { name: parsed.name, mime: parsed.mime, data: parsed.data }, timestamp: Date.now() };
          } else if (parsed.type === 'text') {
            newMsg = { sender: data.fromCode, text: visualCipher.decode(parsed.content), timestamp: Date.now() };
          } else {
            newMsg = { sender: data.fromCode, text: visualCipher.decode(decryptedCode), timestamp: Date.now() };
          }
        } catch(e) {
          // Fallback para mensagens antigas
          newMsg = { sender: data.fromCode, text: visualCipher.decode(decryptedCode), timestamp: Date.now() };
        }
        
        const isConversationOpen = activeContactRef.current === data.fromCode;

        if (!isConversationOpen) {
          setUnreadCounts(prev => ({ ...prev, [data.fromCode]: (prev[data.fromCode] || 0) + 1 }));
          if (settingsRef.current.notificationsEnabled) {
            playNotificationSound();
          }
        }
        
        setMessages(prev => {
          const chat = prev[data.fromCode] || [];
          return {
            ...prev,
            [data.fromCode]: [...chat, newMsg]
          };
        });
        
        setContacts(prev => {
          if (prev[data.fromCode]) return prev;
          return { ...prev, [data.fromCode]: { alias: `Agente ${formatId(data.fromCode)}`, type: 'standard' } };
        });
      } catch (error) {
        console.error("Falha ao descriptografar", error);
      }
    };

    const handleDeleteHistory = (data: { fromCode: string }) => {
      setMessages(prev => {
        const newMsg = { ...prev };
        delete newMsg[data.fromCode];
        return newMsg;
      });
    };

    socket.off('receive_message');
    socket.off('delete_history');
    socket.on('receive_message', handleReceive);
    socket.on('delete_history', handleDeleteHistory);
  }, [socket]);

  // MODO CHACAL: Ouvintes e Sincronização
  useEffect(() => {
    if (!socket || !myId) return;

    const listenToDrops = async () => {
      for (const [id, info] of Object.entries(contacts)) {
        if (info.type === 'jackal' && info.passphrase) {
          const dropId = await getJackalDropId(info.passphrase);
          socket.emit('jackal_listen', dropId);
        }
      }
    };

    listenToDrops();
    const interval = setInterval(listenToDrops, 5 * 60 * 1000);

    const handleJackalReceive = async (data: { dropId: string, encryptedPayload: string, timestamp: number, senderId: string }) => {
      if (!settingsRef.current.receiveMessages) return;
      if (data.senderId === myId) return; // Ignora ecos de nós mesmos

      for (const [id, info] of Object.entries(contacts)) {
        if (info.type === 'jackal' && info.passphrase) {
          const expectedDropId = await getJackalDropId(info.passphrase);
          if (expectedDropId === data.dropId) {
            try {
              const key = await deriveJackalKey(info.passphrase);
              const decrypted = await decryptJackalMessage(data.encryptedPayload, key);
              const parsed = JSON.parse(decrypted);
              
              let newMsg: ChatMessage;
              if (parsed.type === 'file') {
                newMsg = { sender: id, file: { name: parsed.name, mime: parsed.mime, data: parsed.data }, timestamp: data.timestamp };
              } else {
                newMsg = { sender: id, text: parsed.content, timestamp: data.timestamp };
              }
              
              const isConversationOpen = activeContactRef.current === id;

              if (!isConversationOpen) {
                setUnreadCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
                if (settingsRef.current.notificationsEnabled) {
                  playNotificationSound();
                }
              }
              
              setMessages(prev => {
                const chat = prev[id] || [];
                if (chat.some(m => m.timestamp === data.timestamp && m.sender === id)) return prev;
                return { ...prev, [id]: [...chat, newMsg] };
              });
            } catch (e) {
              console.error("Falha ao descriptografar drop chacal", e);
            }
          }
        }
      }
    };

    const handleJackalSync = async (data: { dropId: string, messages: any[] }) => {
      for (const msg of data.messages) {
        await handleJackalReceive({ dropId: data.dropId, ...msg });
      }
    };

    socket.on('jackal_receive', handleJackalReceive);
    socket.on('jackal_sync', handleJackalSync);

    return () => {
      clearInterval(interval);
      socket.off('jackal_receive', handleJackalReceive);
      socket.off('jackal_sync', handleJackalSync);
    };
  }, [socket, myId, contacts]);

  // === WEBRTC REMOVIDO ===

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  const handleAddContact = () => {
    if (newContactId && !contacts[newContactId] && newContactId !== myId) {
      setContacts({ ...contacts, [newContactId]: { alias: `Desconhecido ${formatId(newContactId)}`, type: 'standard' } });
      setActiveContact(newContactId);
      setNewContactId('');
    }
  };

  const handleAddJackalContact = () => {
    setModalInput('');
    setActiveModal('jackal');
  };

  const confirmJackal = () => {
    const passphrase = modalInput;
    if (passphrase && passphrase.trim()) {
      const id = `jackal-${btoa(passphrase.trim()).substring(0, 16)}`;
      if (!contacts[id]) {
        setContacts({ ...contacts, [id]: { alias: `Fantasma ${formatId(id)}`, type: 'jackal', passphrase: passphrase.trim() } });
        setActiveContact(id);
      }
    }
    setActiveModal(null);
  };

  const handleEditAlias = (contactId: string) => {
    setModalTargetContact(contactId);
    setModalInput(contacts[contactId].alias);
    setActiveModal('edit_alias');
  };

  const confirmEditAlias = () => {
    if (modalTargetContact && modalInput.trim()) {
      setContacts(prev => ({ ...prev, [modalTargetContact]: { ...prev[modalTargetContact], alias: modalInput.trim() } }));
    }
    setActiveModal(null);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeContact || !socket || !myKeys) return;

    const messageText = inputText.trim();
    const contactInfo = contacts[activeContact];
    
    setMessages(prev => {
      const chat = prev[activeContact] || [];
      return {
        ...prev,
        [activeContact]: [...chat, { sender: myId, text: messageText, timestamp: Date.now() }]
      };
    });

    const payloadStr = JSON.stringify({ type: 'text', content: messageText });
    
    if (contactInfo.type === 'jackal' && contactInfo.passphrase) {
      const key = await deriveJackalKey(contactInfo.passphrase);
      const dropId = await getJackalDropId(contactInfo.passphrase);
      const encryptedPayload = await encryptJackalMessage(payloadStr, key);
      
      socket.emit('jackal_post', {
        dropId,
        encryptedPayload,
        senderId: myId
      });
    } else {
      const encryptedPayload = await encryptMessage(payloadStr, myKeys.private, activeContact);
      socket.emit('send_message', {
        fromCode: myId,
        toCode: activeContact,
        encryptedPayload
      });
    }

    setInputText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeContact || !socket || !myKeys) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. O limite de segurança é 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = ev.target?.result as string;
      const contactInfo = contacts[activeContact];
      
      const newMsg: ChatMessage = {
        sender: myId,
        file: { name: file.name, mime: file.type, data: base64Data },
        timestamp: Date.now()
      };
      
      setMessages(prev => {
        const chat = prev[activeContact] || [];
        return { ...prev, [activeContact]: [...chat, newMsg] };
      });

      const payloadStr = JSON.stringify({
        type: 'file',
        name: file.name,
        mime: file.type,
        data: base64Data
      });

      if (contactInfo.type === 'jackal' && contactInfo.passphrase) {
        const key = await deriveJackalKey(contactInfo.passphrase);
        const dropId = await getJackalDropId(contactInfo.passphrase);
        const encryptedPayload = await encryptJackalMessage(payloadStr, key);
        
        socket.emit('jackal_post', {
          dropId,
          encryptedPayload,
          senderId: myId
        });
      } else {
        const encryptedPayload = await encryptMessage(payloadStr, myKeys.private, activeContact);
        socket.emit('send_message', {
          fromCode: myId,
          toCode: activeContact,
          encryptedPayload
        });
      }
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearChat = (contactId: string) => {
    // Apaga localmente
    setMessages(prev => {
      const newMsg = { ...prev };
      delete newMsg[contactId];
      return newMsg;
    });

    // Se for um contato padrão (não-chacal), emite o sinal remoto
    const contactInfo = contacts[contactId];
    if (contactInfo && contactInfo.type === 'standard') {
      socket?.emit('delete_history', { toCode: contactId, fromCode: myId });
    } else if (contactInfo && contactInfo.type === 'jackal') {
      // Nota: o sistema chacal funciona por broadcast assíncrono.
      // Para apagar completamente o histórico num canal chacal remoto seria necessário 
      // um sinal complexo de "purge". Por enquanto, apaga apenas localmente.
      // Poderíamos implementar um payload falso do tipo "purge" para chacal no futuro.
    }
  };

  const handleDeleteContact = (contactId: string) => {
    setModalTargetContact(contactId);
    setActiveModal('delete_contact');
  };

  const confirmDelete = () => {
    if (modalTargetContact) {
      setContacts(prev => {
        const newContacts = { ...prev };
        delete newContacts[modalTargetContact];
        return newContacts;
      });

      setMessages(prev => {
        const newMsg = { ...prev };
        delete newMsg[modalTargetContact];
        return newMsg;
      });

      if (activeContact === modalTargetContact) {
        setActiveContact(null);
      }
    }
    setActiveModal(null);
  };

  const handleExportQR = async () => {
    if (!myKeys) return;
    const exportedPriv = await exportPrivateKey(myKeys.private);
    const data = JSON.stringify({
      priv: exportedPriv,
      pub: myId
    });
    setSyncQRData(data);
    setIsScanning(false);
  };

  const handleScanQR = async (text: string) => {
    try {
      const data = JSON.parse(text);
      if (data.priv && data.pub) {
        localStorage.setItem('refugio_private_key', data.priv);
        localStorage.setItem('refugio_public_key', data.pub);
        alert('Identidade clonada com sucesso! O sistema será reiniciado.');
        window.location.reload();
      } else {
        alert('QR Code inválido.');
      }
    } catch (e) {
      alert('Falha ao ler QR Code.');
    }
  };

  if (!myId) {
    // Mantemos uma tela branca enquanto carrega, para não levantar suspeitas
    return <div className="flex h-screen bg-white"></div>;
  }

  // TELA DE DISFARCE (404 Real do Next.js)
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white text-black font-sans text-center">
        <h1 className="text-4xl font-bold mb-4">404 Not Found</h1>
        <hr className="w-1/4 border-gray-400 mb-4" />
        <p className="text-sm text-gray-600">nginx/1.18.0 (Ubuntu)</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 font-sans">
      


      {/* Modais Dinâmicos */}
      {activeModal && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className={`bg-[#0a0a0a] border p-6 rounded-2xl max-w-md w-full shadow-2xl ${activeModal === 'jackal' ? 'border-purple-500 shadow-purple-900/20' : 'border-zinc-800'}`}>
            
            {activeModal === 'jackal' && (
              <>
                <h2 className="text-xl font-bold mb-2 text-purple-500 flex items-center gap-2"><Ghost /> Canal Fantasma</h2>
                <p className="text-sm text-zinc-400 mb-6">Digite a Senha Mestra pré-combinada com seu contato. O sistema gerará um ponto de encontro criptográfico rotativo atrelado a essa senha.</p>
                <input 
                  type="password"
                  placeholder="Senha Mestra..."
                  value={modalInput}
                  onChange={e => setModalInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmJackal()}
                  className="w-full bg-[#050505] text-zinc-100 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 mb-4 transition-colors"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
                  <button onClick={confirmJackal} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors font-bold">Conectar</button>
                </div>
              </>
            )}

            {activeModal === 'edit_alias' && (
              <>
                <h2 className="text-xl font-bold mb-2 text-zinc-100 flex items-center gap-2"><Edit3 /> Renomear Contato</h2>
                <p className="text-sm text-zinc-400 mb-6">Defina um apelido local para este agente. Este nome só existe neste dispositivo.</p>
                <input 
                  type="text"
                  placeholder="Apelido..."
                  value={modalInput}
                  onChange={e => setModalInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmEditAlias()}
                  className="w-full bg-[#050505] text-zinc-100 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 mb-4 transition-colors"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
                  <button onClick={confirmEditAlias} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors font-bold">Salvar</button>
                </div>
              </>
            )}

            {activeModal === 'delete_contact' && (
              <>
                <h2 className="text-xl font-bold mb-2 text-red-500 flex items-center gap-2"><UserX /> Excluir Contato</h2>
                <p className="text-sm text-zinc-400 mb-6">Tem certeza que deseja apagar este contato e todo o histórico associado? Você precisará da ID completa (ou da Senha Mestra) para reconectar.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
                  <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-bold">Excluir Permanentemente</button>
                </div>
              </>
            )}

            {activeModal === 'settings' && (
              <>
                <h2 className="text-xl font-bold mb-6 text-zinc-100 flex items-center gap-2"><Settings className="text-[#5b32f5]"/> Configurações</h2>
                
                <div className="space-y-6">
                  {/* Nome de Usuário (Apenas Visual / Local) */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Apelido Pessoal (Local)</label>
                    <input 
                      type="text"
                      placeholder="Ex: Unknown"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-[#050505] text-zinc-100 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5b32f5] transition-colors"
                    />
                    <p className="text-xs text-zinc-600 mt-2">Usado apenas para exibir na sua própria tela. Sua verdadeira identidade (ID) nunca é alterada.</p>
                  </div>

                  <hr className="border-zinc-800" />

                  {/* Receber Mensagens */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-200 text-sm">Receber Mensagens</h3>
                      <p className="text-xs text-zinc-500 mt-1">Quando desativado, o aplicativo ignorará e bloqueará todas as mensagens e pacotes invisivelmente.</p>
                    </div>
                    <button 
                      onClick={() => setReceiveMessages(!receiveMessages)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${receiveMessages ? 'bg-[#5b32f5]' : 'bg-zinc-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${receiveMessages ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <hr className="border-zinc-800" />

                  {/* Notificações Sonoras */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-200 text-sm">Alertas Sonoros</h3>
                      <p className="text-xs text-zinc-500 mt-1">Tocar um som discreto quando uma mensagem chegar e o aplicativo estiver minimizado.</p>
                    </div>
                    <button 
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-[#5b32f5]' : 'bg-zinc-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <button onClick={() => setActiveModal(null)} className="px-6 py-2 bg-[#5b32f5] hover:bg-purple-600 text-white rounded-xl transition-colors font-bold">Concluído</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Modal de Sincronização */}
      {showSyncModal && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-purple-500 flex items-center gap-2"><Smartphone /> Sincronizar Dispositivos</h2>
            <p className="text-sm text-zinc-400 mb-6">Compartilhe sua identidade secreta (Chave Privada) com outro aparelho.</p>
            
            <div className="mb-6 p-4 border border-zinc-800 bg-[#050505] rounded-xl text-center">
              <h3 className="font-bold text-sm mb-2 text-zinc-300">ESTE É O DISPOSITIVO ANTIGO?</h3>
              <p className="text-xs text-zinc-500 mb-4">Mostre o QR Code na tela para o seu novo celular ler.</p>
              
              {syncQRData ? (
                <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl mx-auto w-fit">
                  <QRCode value={syncQRData} size={200} level="L" />
                </div>
              ) : (
                <button onClick={handleExportQR} className="w-full bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg text-sm transition-colors font-medium flex items-center justify-center gap-2"><QrCode size={16}/> Gerar QR Code Seguro</button>
              )}
            </div>

            <div className="p-4 border border-zinc-800 bg-[#050505] rounded-xl text-center">
              <h3 className="font-bold text-sm mb-2 text-zinc-300">ESTE É O NOVO DISPOSITIVO?</h3>
              <p className="text-xs text-zinc-500 mb-4">Escaneie o QR Code do seu aparelho antigo.</p>
              
              {isScanning ? (
                <QRScanner onScan={handleScanQR} onError={() => {}} />
              ) : (
                <button onClick={() => setIsScanning(true)} className="w-full bg-purple-600 hover:bg-purple-500 p-2 rounded-lg text-sm transition-colors font-medium text-white flex items-center justify-center gap-2"><Smartphone size={16} /> Abrir Câmera</button>
              )}
            </div>

            <button onClick={() => setShowSyncModal(false)} className="mt-6 w-full text-zinc-500 hover:text-zinc-300 text-sm">Cancelar / Fechar</button>
          </div>
        </div>
      )}

      {/* Sidebar Lateral */}
      <div className="w-80 border-r border-zinc-800/50 bg-[#0a0a0a] flex flex-col hidden lg:flex">
        {/* Meu Perfil */}
        <div className="p-6 border-b border-zinc-800/50 relative">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Unknown Logo" className="w-10 h-10 object-contain rounded-lg drop-shadow-[0_0_15px_rgba(91,50,245,0.5)]" />
            <h1 className="font-bold tracking-widest text-lg flex items-center uppercase">
              {username || 'UNKNOWN'} <span className="text-[#5b32f5] ml-1 text-2xl leading-none">•</span>
            </h1>
          </div>
          <div className="text-xs text-zinc-500 mb-2 font-medium">SEU CÓDIGO DE IDENTIFICAÇÃO</div>
          <div className="flex items-center gap-2 bg-[#050505] p-2 rounded-xl border border-zinc-800">
            <span className="truncate text-xs text-zinc-400 flex-1">{myId}</span>
            <button onClick={() => navigator.clipboard.writeText(myId)} className="text-zinc-500 hover:text-[#5b32f5] transition-colors p-1">
              <Copy size={16} />
            </button>
          </div>
          <button 
            onClick={() => setShowSyncModal(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 text-xs py-2 rounded-xl transition-colors text-zinc-300"
          >
            <QrCode size={14} /> Parear Celular / PC
          </button>
        </div>

        {/* Adicionar Contato */}
        <div className="p-4 border-b border-zinc-800/50 flex flex-col gap-2">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Inserir ID Direta" 
              value={newContactId}
              onChange={(e) => setNewContactId(e.target.value)}
              className="flex-1 bg-[#050505] text-xs text-zinc-100 border border-zinc-800 rounded-xl px-3 py-2 focus:outline-none focus:border-[#5b32f5] transition-colors"
            />
            <button onClick={handleAddContact} title="Adicionar Conexão Direta" className="bg-zinc-800/80 hover:bg-zinc-700 p-2 rounded-xl transition-colors text-zinc-300">
              <UserPlus size={16} />
            </button>
          </div>
          <button onClick={handleAddJackalContact} className="w-full flex items-center justify-center gap-2 bg-[#050505] hover:bg-zinc-900 text-xs py-2 rounded-xl transition-colors text-zinc-500 hover:text-[#5b32f5] border border-zinc-800">
            <Ghost size={14} /> Criar Canal Fantasma
          </button>
        </div>

        {/* Lista de Contatos */}
        <div className="flex-1 overflow-y-auto">
          {Object.keys(contacts).length === 0 && (
            <div className="text-zinc-600 text-xs text-center p-6 italic mt-4">
              Nenhum contato ativo.<br/>Inicie uma conexão segura.
            </div>
          )}
          {Object.entries(contacts).map(([contactId, info]) => (
            <button
              key={contactId}
              onClick={() => setActiveContact(contactId)}
              className={`w-full text-left p-4 border-b border-zinc-800/30 flex items-center gap-3 transition-colors ${activeContact === contactId ? 'bg-zinc-800/40 border-l-2 border-l-[#5b32f5]' : 'hover:bg-zinc-800/20 border-l-2 border-transparent'}`}
            >
              <div className={`w-12 h-12 rounded-full bg-[#050505] border flex items-center justify-center ${info.type === 'jackal' ? 'border-[#5b32f5]/50 text-[#5b32f5]' : 'border-zinc-700 text-zinc-500'}`}>
                {info.type === 'jackal' ? <Ghost size={20} /> : <KeyRound size={20} />}
              </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-bold text-zinc-100 truncate">{info.alias}</div>
                  <div className="text-xs text-zinc-500 truncate mt-0.5">{info.type === 'jackal' ? 'Canal Fantasma' : `ID: ${formatId(contactId)}`}</div>
                </div>
                {unreadCounts[contactId] > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#5b32f5] flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-purple-900/50">
                    {unreadCounts[contactId]}
                  </div>
                )}
              </button>
          ))}
        </div>
      </div>

      {/* Área Principal do Chat */}
      <div className="flex-1 flex flex-col bg-[#050505] relative">
        {activeContact ? (
          <>
            {/* Header do Chat */}
            <div className="h-20 border-b border-zinc-800/50 bg-[#0a0a0a] p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveContact(null)} className="text-zinc-500 hover:text-white transition-colors lg:hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className={`w-10 h-10 rounded-full bg-[#050505] border flex items-center justify-center ${contacts[activeContact].type === 'jackal' ? 'border-[#5b32f5]/50 text-[#5b32f5]' : 'border-zinc-700 text-zinc-400'}`}>
                  {contacts[activeContact].type === 'jackal' ? <Ghost size={18} /> : <Shield size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-zinc-100">{contacts[activeContact].alias}</span>
                    <button onClick={() => handleEditAlias(activeContact)} className="text-zinc-500 hover:text-[#5b32f5] transition-colors" title="Editar Apelido">
                      <Edit3 size={14} />
                    </button>
                  </div>
                  <div className="text-xs text-[#5b32f5] flex items-center gap-1 font-medium mt-0.5">
                    online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveModal('settings')} className="text-zinc-500 hover:text-[#5b32f5] transition-colors p-2" title="Configurações">
                  <Settings size={20} />
                </button>
                <div className="w-px h-6 bg-zinc-800 mx-2"></div>
                <button onClick={() => clearChat(activeContact)} className="text-zinc-500 hover:text-yellow-500 transition-colors p-2" title="Apagar Histórico">
                  <Eraser size={20} />
                </button>
                <button onClick={() => handleDeleteContact(activeContact)} className="text-zinc-500 hover:text-red-500 transition-colors p-2" title="Excluir Contato">
                  <UserX size={20} />
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505]">
              {(messages[activeContact] || []).map((msg, i) => (
                <MessageBubble key={i} msg={msg} isMe={msg.sender === myId} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[#0a0a0a] border-t border-zinc-800/50 pb-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 bg-[#050505] border border-zinc-800/80 rounded-full p-1.5 focus-within:border-zinc-600 transition-colors shadow-inner">
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-zinc-500 hover:text-zinc-300 p-2.5 rounded-full transition-colors ml-1"
                    title="Enviar Arquivo Seguro"
                  >
                    <Paperclip size={20} />
                  </button>
                  <div className="text-zinc-600 font-mono flex items-center mx-1">
                    {'</>'}
                  </div>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="| Digite um código..."
                    className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none text-zinc-200 placeholder-zinc-600"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="bg-[#5b32f5] hover:bg-[#4f2ce0] disabled:opacity-50 disabled:hover:bg-[#5b32f5] text-white p-2.5 rounded-full transition-colors mr-1 shadow-md shadow-purple-900/20"
                  >
                    <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
                  </button>
                </div>
                <div className="text-center mt-3 text-[10px] text-zinc-600 font-medium">
                  Escreva apenas em código. Mensagens comuns não são permitidas.
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600/40">
            <div className="w-24 h-24 mb-6 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900/20">
              <span className="text-4xl text-zinc-700">?</span>
            </div>
            <p className="text-sm font-medium">Você não sabe</p>
            <p className="text-sm font-medium">com quem está falando.</p>
          </div>
        )}
      </div>
    </div>
  );
}
