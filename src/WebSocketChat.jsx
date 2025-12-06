// src/WebSocketChat.jsx - Improved Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import InfiniteScroll from 'react-infinite-scroll-component';
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
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [firstAccess, setFirstAccess] = useState(true);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageTimeoutsRef = useRef(new Map()); // Track timeouts for each message
  const messageIdsRef = useRef(new Set()); // Track message IDs for deduplication
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  // Load current user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser({
          id: user._id,
          name: user.name,
          avatar: user.avatar || user.name.charAt(0).toUpperCase(),
          email: user.email,
          username: user.username
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear all message timeouts
      messageTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      messageTimeoutsRef.current.clear();

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Disconnect and clean up socket
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, [socket]);
  // Reset conversation state
  const resetConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setPage(1);
    setHasMoreMessages(true);
    setFirstAccess(true);
    setTyping(false);
    messageIdsRef.current.clear();
    messageTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    messageTimeoutsRef.current.clear();
  }, []);
  // Start chat with username
  const startChatWithUser = async (username) => {
    // Clear previous errors
    setError('');
    setUsernameError('');

    // Validation
    if (!username.trim()) {
      setUsernameError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (username === currentUser?.username) {
      setUsernameError('You cannot message yourself');
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);

    try {
      const accessToken = localStorage.getItem('access_token');

      // Fetch user info
      const userRes = await api.get(`/users/${username}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const recipient = userRes.data.user || userRes.data.data?.user || userRes.data;
      // Disconnect old socket if exists
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
      }
      // Reset conversation state
      resetConversation();
      setOtherUser({
        id: recipient._id,
        name: recipient.name,
        avatar: recipient.avatar || recipient.name.charAt(0).toUpperCase(),
        email: recipient.email,
        status: 'online'
      });
      // Fetch conversation history
      const convRes = await api.get(`/conversations/recipient/${recipient._id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 20, page: 1 }
      });
      const oldMessages = convRes.data.result || convRes.data.data || [];
      if (oldMessages.length > 0) {
        const convId = oldMessages[0].conversationId.toString();
        setConversationId(convId);

        const formattedMessages = oldMessages.map((msg) => ({
          id: msg._id,
          text: msg.message,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          timestamp: msg.timestamp,
          status: msg.status || 'sent'
        }));

        // Track message IDs
        formattedMessages.forEach((msg) => messageIdsRef.current.add(msg.id));
        setMessages(formattedMessages);

        // Check if there are more messages
        if (convRes.data.totalPage && convRes.data.totalPage > 1) {
          setHasMoreMessages(true);
        } else {
          setHasMoreMessages(false);
        }
      }
      // Connect socket
      connectSocket(recipient._id);
    } catch (err) {
      console.error('Error connecting to user:', err);
      if (err.response?.status === 404) {
        setUsernameError('User not found');
        setError('This user does not exist in the system');
      } else if (err.response?.status === 400) {
        setUsernameError(err.response.data.message || 'Cannot connect to this user');
        setError(err.response.data.message || 'An error occurred');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please login again');
      } else {
        setUsernameError('Cannot connect to server');
        setError('Please check your network connection and try again');
      }
    } finally {
      setIsConnecting(false);
    }
  };
  // Connect socket
  const connectSocket = useCallback(
    (recipientId) => {
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
        const systemMsgId = `system-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: systemMsgId,
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
          // Deduplication check
          const msgId = data._id || `${data.senderId}-${data.timestamp}`;
          if (messageIdsRef.current.has(msgId)) {
            return; // Skip duplicate
          }
          messageIdsRef.current.add(msgId);
          if (!conversationId && data.conversationId) {
            setConversationId(data.conversationId);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: msgId,
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
        // Clear the failure timeout for this message
        if (messageTimeoutsRef.current.has(data.tempId)) {
          clearTimeout(messageTimeoutsRef.current.get(data.tempId));
          messageTimeoutsRef.current.delete(data.tempId);
        }
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === data.tempId) {
              // Update message ID tracking
              messageIdsRef.current.delete(data.tempId);
              messageIdsRef.current.add(data.messageId);
              return { ...msg, id: data.messageId, status: 'sent' };
            }
            return msg;
          })
        );
      });
      newSocket.on('message_read', (data) => {
        setMessages((prev) => prev.map((msg) => (msg.id === data.messageId ? { ...msg, status: 'read' } : msg)));
      });
      newSocket.on('user_status', (data) => {
        if (data.userId === recipientId) {
          setOtherUser((prev) => (prev ? { ...prev, status: data.status } : null));
        }
      });
      setSocket(newSocket);
    },
    [currentUser, conversationId]
  );
  const handleSend = () => {
    if (!inputMessage.trim() || !socket || !connected || !currentUser || !otherUser) return;
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const text = inputMessage.trim();

    const newMessage = {
      id: tempId,
      text,
      senderId: currentUser.id,
      recipientId: otherUser.id,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    messageIdsRef.current.add(tempId);
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');
    socket.emit('private_message', {
      recipientId: otherUser.id,
      message: text,
      senderId: currentUser.id,
      tempId,
      conversationId: conversationId || undefined,
      timestamp: newMessage.timestamp
    });
    // Set timeout for failure status
    const timeoutId = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId && msg.status === 'sending' ? { ...msg, status: 'failed' } : msg))
      );
      messageTimeoutsRef.current.delete(tempId);
    }, 10000);
    messageTimeoutsRef.current.set(tempId, timeoutId);
  };
  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    if (socket && connected && e.target.value.length > 0 && otherUser) {
      socket.emit('typing', {
        recipientId: otherUser.id,
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
  const fetchMoreData = async () => {
    if (!conversationId || !hasMoreMessages) return;
    try {
      const accessToken = localStorage.getItem('access_token');
      const nextPage = page + 1;

      const res = await api.get(`/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 20, page: nextPage }
      });
      const data = res.data;
      const olderMessages = data.result || data.data || [];
      if (olderMessages.length > 0) {
        const formattedMessages = olderMessages.map((msg) => ({
          id: msg._id,
          text: msg.message,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          timestamp: msg.timestamp,
          status: msg.status || 'sent'
        }));
        // Track message IDs and filter duplicates
        const newMessages = formattedMessages.filter((msg) => {
          if (messageIdsRef.current.has(msg.id)) {
            return false;
          }
          messageIdsRef.current.add(msg.id);
          return true;
        });
        if (newMessages.length > 0) {
          setMessages((prev) => [...newMessages, ...prev]);
        }

        setPage(nextPage);
      }
      // Check if we've reached the end based on API response
      if (data.totalPage && nextPage >= data.totalPage) {
        setHasMoreMessages(false);
      } else if (olderMessages.length === 0) {
        // No messages returned means we've reached the end
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Error fetching older messages:', err);
      setHasMoreMessages(false);
    }
  };
  // Auto-scroll to bottom on first load
  useEffect(() => {
    if (firstAccess && messages.length > 0) {
      const scrollableDiv = document.getElementById('scrollableDiv');
      if (scrollableDiv) {
        setTimeout(() => {
          scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
          setFirstAccess(false);
        }, 100);
      }
    }
  }, [messages, firstAccess]);
  // UI Loading State
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
  // UI User Selection
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
            <MessageCircle size={64} className='chat-empty-icon' />
            <Typography variant='h5' className='chat-empty-title' sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Select a User to Chat
            </Typography>
            <Typography
              variant='body1'
              className='chat-empty-subtitle'
              textAlign='center'
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Enter the username of the person you want to message
            </Typography>
            <TextField
              fullWidth
              label='User Name'
              value={targetUsername}
              onChange={(e) => {
                setTargetUsername(e.target.value);
                // Clear error when user types
                if (usernameError) setUsernameError('');
                if (error) setError('');
              }}
              placeholder='Enter username...'
              variant='outlined'
              className='chat-input-field'
              error={!!usernameError}
              helperText={usernameError}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '14px', sm: '15px' }
                },
                '& .MuiFormHelperText-root': {
                  fontSize: '0.75rem',
                  marginTop: '4px'
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isConnecting && targetUsername.trim()) {
                  startChatWithUser(targetUsername.trim());
                }
              }}
            />
            {error && (
              <Box
                sx={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <WifiOff size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                <Typography
                  variant='body2'
                  sx={{
                    color: '#dc2626',
                    fontSize: '0.875rem',
                    lineHeight: 1.5
                  }}
                >
                  {error}
                </Typography>
              </Box>
            )}
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
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }
  // Main Chat UI
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
            <div
              id='scrollableDiv'
              style={{
                height: '100%',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column-reverse'
              }}
            >
              <InfiniteScroll
                dataLength={messages.length}
                next={fetchMoreData}
                style={{ display: 'flex', flexDirection: 'column-reverse' }}
                inverse={true}
                hasMore={hasMoreMessages}
                loader={
                  <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                }
                scrollableTarget='scrollableDiv'
              >
                {messages
                  .slice()
                  .reverse()
                  .map((msg, index) => {
                    const isSent = msg.senderId === currentUser.id;
                    const isSystem = msg.senderId === 'system' || msg.status === 'system';
                    const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
                    const timestamp = new Date(msg.timestamp).toLocaleTimeString('en-US', {
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
                                  {msg.status === 'failed' && (
                                    <Typography variant='caption' sx={{ color: '#f44336', fontSize: '0.65rem' }}>
                                      Failed
                                    </Typography>
                                  )}
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
              </InfiniteScroll>
            </div>
          </Box>
          {/* Input Area */}
          <Box className='chat-input-area'>
            <Stack direction='row' alignItems='flex-end' gap={1.5}>
              <TextField
                value={inputMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyPress}
                placeholder={connected ? 'Type a message...' : 'Connecting...'}
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
