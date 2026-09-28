const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Configuração do Socket.io permitindo conexões de qualquer origem (útil para desenvolvimento local)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 5e7 // 50 MB
});

// Mapeamento em memória: códigoDeUsuario -> Set<socketId>
// Isso garante que o servidor não saiba quem são as pessoas, apenas conheça seus "Códigos" públicos.
// Permite que uma pessoa tenha múltiplos dispositivos conectados.
const usersMap = new Map();

// --- MODO CHACAL (DEAD DROPS) ---
// deadDrops: Map<dropId, Array<{ encryptedPayload: string, timestamp: number, senderId: string }>>
const deadDrops = new Map();

// Limpeza automática dos drops (apaga qualquer pacote mais velho que 24 horas)
setInterval(() => {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  for (const [dropId, messages] of deadDrops.entries()) {
    const validMessages = messages.filter(msg => (now - msg.timestamp) < twentyFourHours);
    if (validMessages.length === 0) {
      deadDrops.delete(dropId);
    } else if (validMessages.length !== messages.length) {
      deadDrops.set(dropId, validMessages);
    }
  }
}, 60 * 1000); // Roda a cada 1 minuto

io.on('connection', (socket) => {
  console.log(`[+] Nova conexão anônima estabelecida: ${socket.id}`);

  // Quando um usuário entra, ele se registra com seu Código Público
  socket.on('register', (userCode) => {
    if (!usersMap.has(userCode)) {
      usersMap.set(userCode, new Set());
    }
    usersMap.get(userCode).add(socket.id);
    socket.userCode = userCode;
    console.log(`[+] Dispositivo vinculado ao código: ${userCode.substring(0,8)}... -> Socket: ${socket.id}`);
  });

  // Roteamento de mensagens "cegas"
  socket.on('send_message', (data) => {
    const { fromCode, toCode, encryptedPayload } = data;
    
    console.log(`[>] Roteando pacote de [${fromCode.substring(0,8)}] para [${toCode.substring(0,8)}]`);

    const recipientSockets = usersMap.get(toCode);

    if (recipientSockets && recipientSockets.size > 0) {
      // Repassa a mensagem para TODOS os dispositivos daquele destinatário
      for (let recipientSocketId of recipientSockets) {
        io.to(recipientSocketId).emit('receive_message', {
          fromCode,
          encryptedPayload
        });
      }
      console.log(`[OK] Pacote entregue a ${recipientSockets.size} dispositivo(s).`);
    } else {
      console.log(`[X] Falha na entrega: Destinatário não está online.`);
      socket.emit('message_failed', { toCode, reason: 'offline' });
    }
  });

  // Roteamento para pareamento de dispositivos (Sincronização)
  const syncMap = new Map(); // syncCode -> socket.id

  socket.on('request_sync_code', () => {
    // Gera um código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    syncMap.set(code, socket.id);
    socket.emit('sync_code_generated', code);
    
    // Expira em 2 minutos
    setTimeout(() => {
      if (syncMap.get(code) === socket.id) syncMap.delete(code);
    }, 120000);
  });

  socket.on('perform_sync', (data) => {
    const targetSocketId = syncMap.get(data.syncCode);
    if (targetSocketId) {
      io.to(targetSocketId).emit('sync_device_receive', {
        exportedPrivateKey: data.exportedPrivateKey,
        exportedPublicKey: data.exportedPublicKey
      });
      syncMap.delete(data.syncCode);
      socket.emit('sync_success');
    } else {
      socket.emit('sync_failed');
    }
  });

  // --- EVENTOS DO MODO CHACAL ---
  socket.on('jackal_post', (data) => {
    const { dropId, encryptedPayload, senderId } = data;
    
    if (!deadDrops.has(dropId)) {
      deadDrops.set(dropId, []);
    }
    
    const dropQueue = deadDrops.get(dropId);
    dropQueue.push({ encryptedPayload, timestamp: Date.now(), senderId });
    
    io.to(`drop_${dropId}`).emit('jackal_receive', { dropId, encryptedPayload, timestamp: Date.now(), senderId });
  });

  socket.on('jackal_listen', (dropId) => {
    socket.join(`drop_${dropId}`);
    
    if (deadDrops.has(dropId)) {
      const messages = deadDrops.get(dropId);
      socket.emit('jackal_sync', { dropId, messages });
    }
  });

  socket.on('delete_history', (data) => {
    // data = { toCode, fromCode }
    const targetSockets = usersMap.get(data.toCode);
    if (targetSockets) {
      targetSockets.forEach(id => {
        io.to(id).emit('delete_history', {
          fromCode: data.fromCode
        });
      });
    }
  });

  socket.on('sync_my_device', (data) => {
    const { fromCode, toContact, encryptedPayload, timestamp } = data;
    const mySockets = usersMap.get(fromCode);
    if (mySockets) {
      for (let socketId of mySockets) {
        if (socketId !== socket.id) {
          io.to(socketId).emit('receive_sync_my_device', { toContact, encryptedPayload, timestamp });
        }
      }
    }
  });

  // === WEBRTC REMOVIDO ===

  socket.on('disconnect', () => {
    console.log(`[-] Conexão encerrada: ${socket.id}`);
    if (socket.userCode && usersMap.has(socket.userCode)) {
      usersMap.get(socket.userCode).delete(socket.id);
      if (usersMap.get(socket.userCode).size === 0) {
        usersMap.delete(socket.userCode);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Servidor Unknown operando na porta ${PORT}`);
  console.log(` Status: OUVINDO ROTEAMENTOS CEGOS`);
  console.log(`=========================================`);
});
