// src/WebSocketChat.jsx (giữ nguyên .jsx)
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from './api';
import {
  Box,
  Paper,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Button,
  Stack,
  CircularProgress,
  Badge,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { MessageCircle, Wifi, WifiOff, Check, CheckCheck } from 'lucide-react';

export default function PrivateChat() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [targetUsername, setTargetUsername] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load current user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser({
        id: user._id,
        name: user.name,
        avatar: user.avatar || user.name.charAt(0).toUpperCase(),
        email: user.email
      });
    }
  }, []);

  // Bắt đầu chat với username
  const startChatWithUser = async (username) => {
    if (!username.trim()) return;
    setIsConnecting(true);

    try {
      const accessToken = localStorage.getItem('access_token');
      const userRes = await api.get(`/users/${username}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const recipient = userRes.data.user || userRes.data.data?.user || userRes.data;

      setOtherUser({
        id: recipient._id,
        name: recipient.name,
        avatar: recipient.avatar || recipient.name.charAt(0).toUpperCase(),
        email: recipient.email,
        status: 'online'
      });

      // Tìm cuộc trò chuyện cũ
      const convRes = await api.get(`/conversations/recipient/${recipient._id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 50, page: 1 }
      });

      const oldMessages = convRes.data.result || convRes.data.data?.result || [];

      if (oldMessages.length > 0) {
        const convId = oldMessages[0].conversationId.toString();
        setConversationId(convId);
        setMessages(
          oldMessages.map((msg) => ({
            id: msg._id,
            text: msg.message,
            senderId: msg.senderId,
            recipientId: msg.recipientId,
            timestamp: msg.timestamp,
            status: msg.status || 'sent'
          }))
        );
      } else {
        setConversationId(null);
        setMessages([]);
      }

      connectSocket(recipient._id);
    } catch (err) {
      console.error('Error connecting to user:', err);
      if (err.response?.status === 404) {
        alert('User not found');
      } else if (err.response?.status === 400) {
        alert(err.response.data.message || 'Cannot chat with this user');
      } else {
        alert('Failed to connect to user');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Kết nối socket
  const connectSocket = (recipientId) => {
    const accessToken = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const newSocket = io(apiUrl, {
      extraHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', () => setConnected(false));

    newSocket.on('welcome', (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `welcome-${Date.now()}`,
          text: msg,
          senderId: 'system',
          timestamp: new Date().toISOString(),
          status: 'system'
        }
      ]);
    });

    newSocket.on('new_message', (data) => {
      if (
        (data.senderId === recipientId && data.recipientId === currentUser?.id) ||
        (data.senderId === currentUser?.id && data.recipientId === recipientId)
      ) {
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: data._id || Date.now(),
            text: data.message,
            senderId: data.senderId,
            recipientId: data.recipientId,
            timestamp: data.timestamp || new Date().toISOString(),
            status: 'received'
          }
        ]);
      }
    });

    newSocket.on('user_typing', (data) => {
      if (data.senderId === recipientId) {
        setTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 1000);
      }
    });

    newSocket.on('message_sent', (data) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.tempId ? { ...msg, id: data.messageId, status: 'sent' } : msg))
      );
      if (data.conversationId) {
        setConversationId(data.conversationId.toString());
      }
    });

    newSocket.on('message_read', (data) => {
      setMessages((prev) => prev.map((msg) => (msg.id === data.messageId ? { ...msg, status: 'read' } : msg)));
    });

    newSocket.on('user_status', (data) => {
      if (data.userId === recipientId) {
        setOtherUser((prev) => ({ ...prev, status: data.status }));
      }
    });

    setSocket(newSocket);
  };

  const handleSend = () => {
    if (!inputMessage.trim() || !socket || !connected || !currentUser || !otherUser) return;

    const tempId = `temp-${Date.now()}`;
    const text = inputMessage.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text,
        senderId: currentUser.id,
        timestamp: new Date().toISOString(),
        status: 'sending'
      }
    ]);
    setInputMessage('');

    socket.emit('private_message', {
      recipientId: otherUser.id,
      message: text,
      senderId: currentUser.id,
      tempId,
      conversationId: conversationId || undefined,
      timestamp: new Date().toISOString()
    });

    // Fallback: Update status to 'failed' if no response within 10 seconds
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId && msg.status === 'sending' ? { ...msg, status: 'failed' } : msg))
      );
    }, 10000);
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    if (socket && connected && e.target.value.length > 0) {
      socket.emit('typing', {
        recipientId: otherUser?.id,
        senderId: currentUser?.id
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket]);

  // UI
  if (!currentUser) {
    return (
      <Box className='chat-loading-container'>
        <Stack alignItems='center' spacing={3}>
          <CircularProgress size={60} thickness={4} className='chat-loading-spinner' />
          <Typography variant='h6' className='chat-loading-text'>
            Loading...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!otherUser) {
    return (
      <Box className='chat-container'>
        <Paper
          className='chat-paper chat-select-user-form'
          elevation={24}
          sx={{
            maxWidth: { xs: '100%', sm: 500 },
            height: { xs: '100vh', sm: 'auto' },
            padding: { xs: 3, sm: 4 },
            borderRadius: { xs: 0, sm: '1.5rem' }
          }}
        >
          <Stack spacing={{ xs: 2.5, sm: 3 }} alignItems='center'>
            <MessageCircle
              size={64}
              className='chat-empty-icon'
              sx={{ width: { xs: 56, sm: 64 }, height: { xs: 56, sm: 64 } }}
            />
            <Typography variant='h5' className='chat-empty-title' sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Chọn người để nhắn tin
            </Typography>
            <Typography
              variant='body1'
              className='chat-empty-subtitle'
              textAlign='center'
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Nhập username của người bạn muốn nhắn tin
            </Typography>
            <TextField
              fullWidth
              label='User Name'
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              placeholder='Nhập username...'
              variant='outlined'
              className='chat-input-field'
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '14px', sm: '15px' }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isConnecting && targetUsername.trim()) {
                  startChatWithUser(targetUsername.trim());
                }
              }}
            />
            <Button
              onClick={() => startChatWithUser(targetUsername.trim())}
              disabled={!targetUsername.trim() || isConnecting}
              className={`chat-finder-button ${!targetUsername.trim() || isConnecting ? 'disabled' : ''}`}
              fullWidth
              sx={{
                height: { xs: 44, sm: 48 },
                textTransform: 'none',
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 600
              }}
              startIcon={
                isConnecting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <MessageCircle size={20} />
              }
            >
              {isConnecting ? 'Đang kết nối...' : 'Kết nối'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className='chat-container'>
      <Paper className='chat-paper' elevation={24}>
        {/* Header */}
        <Box className='chat-header'>
          <Box className='chat-avatar-wrapper'>
            <Badge
              overlap='circular'
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={connected && otherUser.status === 'online' ? <Box className='online-indicator' /> : null}
            >
              <Avatar className='chat-avatar'>{otherUser.avatar}</Avatar>
            </Badge>
          </Box>
          <Box className='chat-header-info'>
            <Typography variant='h6' className='chat-header-name'>
              {otherUser.name}
            </Typography>
            <Stack direction='row' alignItems='center' spacing={1}>
              {connected ? (
                otherUser.status === 'online' ? (
                  <>
                    <Wifi size={12} />
                    <Typography variant='caption' className='chat-status-text'>
                      Online
                    </Typography>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} />
                    <Typography variant='caption' className='chat-status-text'>
                      Offline
                    </Typography>
                  </>
                )
              ) : (
                <CircularProgress size={12} sx={{ color: 'rgba(255,255,255,0.7)' }} />
              )}
            </Stack>
          </Box>
          <Tooltip title={connected ? 'Connected to server' : 'Disconnected from server'}>
            <Box className={`chat-connection-badge ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            </Box>
          </Tooltip>
        </Box>
        {/* Chat body */}
        <Box className='chat-body'>
          {/* Messages Area */}
          <Box className='chat-messages-area'>
            {messages.length === 0 && (
              <Stack className='chat-empty-state' alignItems='center' justifyContent='center' spacing={2}>
                <MessageCircle size={64} className='chat-empty-icon' />
                <Typography variant='h5' className='chat-empty-title'>
                  {otherUser.name}
                </Typography>
                <Typography variant='body1' className='chat-empty-subtitle'>
                  Bắt đầu cuộc trò chuyện 💬
                </Typography>
              </Stack>
            )}
            {messages.map((msg, index) => {
              const isSent = msg.senderId === currentUser.id;
              const isSystem = msg.senderId === 'system' || msg.status === 'system';
              const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
              const timestamp = new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              });
              if (isSystem) {
                return (
                  <Box key={msg.id} className='chat-system-message'>
                    <Paper className='chat-system-bubble'>{msg.text}</Paper>
                  </Box>
                );
              }
              return (
                <Box key={msg.id} className={`chat-message-wrapper ${isSent ? 'sent' : 'received'}`}>
                  {showAvatar ? (
                    <Avatar className={`chat-message-avatar ${isSent ? 'sent' : 'received'}`}>
                      {isSent ? currentUser.avatar : otherUser.avatar}
                    </Avatar>
                  ) : (
                    <Box className='chat-avatar-spacer' />
                  )}
                  <Box className={`chat-message-content ${isSent ? 'sent' : 'received'}`}>
                    <Paper className={`chat-message-bubble ${isSent ? 'sent' : 'received'}`}>
                      <Typography variant='body2' className='chat-message-text'>
                        {msg.text}
                      </Typography>
                      <Stack direction='row' alignItems='center' spacing={1} className='chat-message-footer'>
                        <Typography variant='caption' className='chat-message-time'>
                          {timestamp}
                        </Typography>
                        {isSent && (
                          <Box className='chat-message-status'>
                            {msg.status === 'sending' && (
                              <CircularProgress size={10} sx={{ color: 'rgba(255,255,255,0.7)' }} />
                            )}
                            {msg.status === 'sent' && <Check size={12} />}
                            {msg.status === 'read' && <CheckCheck size={12} />}
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  </Box>
                </Box>
              );
            })}
            {typing && (
              <Box className='chat-typing-indicator'>
                <Avatar className='chat-typing-avatar'>{otherUser.avatar}</Avatar>
                <Paper className='chat-typing-bubble'>
                  <Stack direction='row' gap={0.75}>
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <Box key={i} className='chat-typing-dot' style={{ animationDelay: `${delay}s` }} />
                    ))}
                  </Stack>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
          {/* Input Area */}
          <Box className='chat-input-area'>
            <Stack direction='row' alignItems='flex-end' gap={1.5}>
              <TextField
                value={inputMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyPress}
                placeholder={connected ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
                disabled={!connected}
                multiline
                minRows={1}
                maxRows={4}
                fullWidth
                variant='outlined'
                className='chat-input-field'
              />
              <IconButton
                onClick={handleSend}
                disabled={!connected || !inputMessage.trim()}
                className={`chat-send-button ${!connected || !inputMessage.trim() ? 'disabled' : ''}`}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
