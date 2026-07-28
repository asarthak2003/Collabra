import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  X,
  Loader2,
  MessageSquare,
  Trash2,
  Send,
  AlertCircle,
  Calendar,
  User,
  ShieldAlert,
  MessagesSquare,
  Wifi,
  WifiOff,
  Paperclip,
  Upload,
  Download,
  FileText
} from 'lucide-react';

function TaskDetailsModal({ isOpen, onClose, taskId, onTaskUpdated, onTaskDeleted }) {
  const { user } = useAuth();

  // Right-hand Panel Active Tab ('comments', 'chat', or 'files')
  const [activeTab, setActiveTab] = useState('comments');

  // Task Details States
  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Comments States
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Attachment States
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Chat Room States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const stompClientRef = useRef(null);
  const chatEndRef = useRef(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const isAdminOrPM = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_PROJECT_MANAGER';

  // Auto-scroll chat window to bottom on new messages
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Load Task particulars on open
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [taskRes, userRes] = await Promise.all([
        api.get(`/api/tasks/${taskId}`),
        api.get('/api/users?size=100')
      ]);

      const t = taskRes.data;
      setTask(t);
      setUsers(userRes.data.content || []);

      // Prepopulate form values
      setTitle(t.title);
      setDescription(t.description || '');
      setStatus(t.status);
      setPriority(t.priority);
      setAssignedUserId(t.assignedUserId ? String(t.assignedUserId) : '');
      setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');

      // Load Comments & Attachments history
      fetchComments();
      fetchAttachments();
    } catch (err) {
      console.error('Failed to load task details:', err);
      setError('Failed to retrieve task particulars.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const res = await api.get(`/api/tasks/${taskId}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      setChatLoading(true);
      const res = await api.get(`/api/tasks/${taskId}/chat`);
      setChatMessages(res.data || []);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      setAttachmentsLoading(true);
      const res = await api.get(`/api/attachments/task/${taskId}`);
      setAttachments(res.data || []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  // Sync Task Details and reset comments tab
  useEffect(() => {
    if (isOpen && taskId) {
      loadData();
      setActiveTab('comments');
    }
  }, [isOpen, taskId]);

  // Load attachments when switching to Files tab
  useEffect(() => {
    if (isOpen && taskId && activeTab === 'files') {
      fetchAttachments();
    }
  }, [isOpen, taskId, activeTab]);

  // WebSocket connection managing Chat room subscription
  useEffect(() => {
    if (!isOpen || activeTab !== 'chat' || !taskId) {
      // Clean up WebSocket client when chat tab is inactive
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setChatConnected(false);
      }
      return;
    }

    // Fetch Chat history first
    fetchChatHistory();

    const token = localStorage.getItem('token');
    const client = new Client({
      webSocketFactory: () => new SockJS((import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '/ws-chat'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('Connected to Task Chat Room:', taskId);
      setChatConnected(true);

      // Subscribe to this task's specific chat channel topic
      client.subscribe('/topic/task/' + taskId, (message) => {
        const received = JSON.parse(message.body);
        setChatMessages((prev) => [...prev, received]);
      });
    };

    client.onDisconnect = () => {
      console.log('Disconnected from Task Chat Room:', taskId);
      setChatConnected(false);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client) {
        client.deactivate();
      }
      setChatConnected(false);
    };
  }, [activeTab, isOpen, taskId]);

  if (!isOpen) return null;

  // Authorization Security Guards
  const isAssignedToCurrentUser = task && task.assignedUserId === user?.id;
  const canModifyAll = isAdminOrPM;
  const canModifyStatus = isAdminOrPM || isAssignedToCurrentUser;

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = canModifyAll
      ? {
        title,
        description,
        status,
        priority,
        assignedUserId: assignedUserId ? parseInt(assignedUserId) : null,
        dueDate: dueDate || null,
        projectId: task.projectId
      }
      : {
        title: task.title,
        description: task.description,
        status,
        priority: task.priority,
        assignedUserId: task.assignedUserId,
        dueDate: task.dueDate,
        projectId: task.projectId
      };

    try {
      await api.put(`/api/tasks/${taskId}`, payload);
      onTaskUpdated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update task settings.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/tasks/${taskId}`);
      onTaskDeleted();
      onClose();
    } catch (err) {
      setError('Failed to delete task.');
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentSubmitting(true);
    try {
      await api.post(`/api/tasks/${taskId}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to upload comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/api/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      await api.post(`/api/attachments/upload?taskId=${taskId}`, formData);
      fetchAttachments();
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadAttachment = async (fileName, originalFileName, downloadUrl) => {
    try {
      const uniqueName = fileName || (downloadUrl ? downloadUrl.split('/').pop() : '');
      if (!uniqueName) {
        throw new Error('Filename could not be extracted');
      }
      const response = await api.get(`/api/attachments/download/${uniqueName}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file:', err);
      setError('Failed to download file.');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/api/attachments/${attachmentId}`);
      fetchAttachments();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  // Push chat message via Stomp publish
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !stompClientRef.current || !chatConnected) return;

    stompClientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify({
        taskId: parseInt(taskId),
        content: chatInput
      })
    });

    setChatInput('');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getUploaderName = (file) => {
    if (file.uploadedByName) return file.uploadedByName;
    const uploader = users.find(u => u.email === file.uploadedBy);
    return uploader ? uploader.name : file.uploadedBy;
  };

  const formatChatTime = (dateInput) => {
    if (!dateInput) return '';
    try {
      let date;
      if (Array.isArray(dateInput)) {
        // Handle Spring Boot Jackson default LocalDateTime serialization as integer array [year, month, day, hour, minute...]
        const [year, month, day, hour, minute] = dateInput;
        date = new Date(year, month - 1, day, hour, minute);
      } else {
        date = new Date(dateInput);
      }
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col md:flex-row h-[85vh] max-h-[700px]">

        {/* Left Column: Edit Form */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-850 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-slate-950">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <h3 className="font-bold text-slate-100">Task Details</h3>
            <button
              onClick={onClose}
              className="p-1 md:hidden text-slate-400 hover:text-slate-100 hover:bg-slate-850 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="animate-spin text-indigo-500 mb-2" size={24} />
              <span className="text-xs">Fetching task particulars...</span>
            </div>
          ) : (
            <form onSubmit={handleUpdateTask} className="space-y-4 flex-1 flex flex-col justify-between">

              <div className="space-y-4">
                {error && (
                  <div className="flex items-center space-x-2 bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-rose-400 text-xs">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Project Scope & Assigned By metadata */}
                <div className="grid grid-cols-2 gap-4 bg-slate-955/20 border border-slate-850 p-3 rounded-xl mb-4">
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-slate-500 tracking-wider">Project Scope</span>
                    <span className="text-xs font-semibold text-slate-300">{task?.projectName || 'No Project'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-slate-500 tracking-wider">Assigned By</span>
                    <span className="text-xs font-semibold text-slate-300">{task?.createdByName || 'System'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canModifyAll || submitting}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    disabled={!canModifyAll || submitting}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Status
                    </label>
                    <select
                      disabled={!canModifyStatus || submitting}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">In Review</option>
                      <option value="TESTING">Testing</option>
                      <option value="DONE">Completed</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                    {!canModifyStatus && (
                      <span className="text-[9px] text-rose-400 mt-1 flex items-center space-x-1">
                        <ShieldAlert size={10} />
                        <span>Assigned users only</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Priority
                    </label>
                    <select
                      disabled={!canModifyAll || submitting}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Assignee
                    </label>
                    <select
                      disabled={!canModifyAll || submitting}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
                      value={assignedUserId}
                      onChange={(e) => setAssignedUserId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      disabled={!canModifyAll || submitting}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-800/60 mt-8">
                {canModifyAll ? (
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    disabled={submitting}
                    className="p-2 bg-slate-950 hover:bg-rose-950 border border-slate-850 rounded-xl text-slate-500 hover:text-rose-500 transition-all active:scale-95"
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl text-xs font-bold transition text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-850 rounded-xl text-xs font-bold transition text-white flex items-center space-x-1.5 shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Right Column: Tabbed Comments & Live Chat */}
        <div className="w-full md:w-[380px] bg-slate-950/20 p-6 flex flex-col h-full overflow-hidden">

          {/* Tab Selector Headers */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-1 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 ${activeTab === 'comments'
                    ? 'text-indigo-400 border-indigo-500'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
              >
                <MessageSquare size={13} />
                <span>Comments ({comments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`pb-1 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 ${activeTab === 'chat'
                    ? 'text-indigo-400 border-indigo-500'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
              >
                <MessagesSquare size={13} />
                <span>Live Chat</span>
              </button>

              <button
                onClick={() => setActiveTab('files')}
                className={`pb-1 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 ${activeTab === 'files'
                    ? 'text-indigo-400 border-indigo-500'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
              >
                <Paperclip size={13} />
                <span>Files ({attachments.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="hidden md:block p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* TAB 1: COMMENTS BOARD */}
          {activeTab === 'comments' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-955 my-2">
                {commentsLoading && comments.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-20">
                    <Loader2 size={18} className="animate-spin text-slate-500" />
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => {
                    const isAuthor = comment.userId === user?.id;
                    const canDeleteComment = isAuthor || isAdminOrPM;
                    return (
                      <div key={comment.id} className="bg-slate-900/40 border border-slate-900 p-3 rounded-xl space-y-2 relative group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[8px] font-bold rounded">
                              {getInitials(comment.userName)}
                            </div>
                            <span className="text-[10px] font-bold text-slate-350">{comment.userName}</span>
                          </div>
                          <span className="text-[8px] text-slate-505">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed pr-6">{comment.content}</p>

                        {canDeleteComment && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="absolute right-2 bottom-2 text-slate-655 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Delete Comment"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                    <MessageSquare size={24} className="text-slate-500 mb-2" />
                    <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">No comments yet</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleAddComment} className="mt-4 shrink-0 relative">
                <input
                  type="text"
                  disabled={commentSubmitting}
                  placeholder="Write a comment..."
                  className="w-full pl-4 pr-10 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={commentSubmitting || !newComment.trim()}
                  className="absolute right-2 top-2 p-1 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition rounded-lg"
                >
                  {commentSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: LIVE CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Connection Status Banner */}
              <div className="flex items-center space-x-1.5 mb-2 px-1">
                {chatConnected ? (
                  <>
                    <Wifi size={12} className="text-emerald-450" />
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Connected Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} className="text-rose-455" />
                    <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Connecting...</span>
                  </>
                )}
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-955 my-2">
                {chatLoading && chatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-20">
                    <Loader2 size={18} className="animate-spin text-slate-505" />
                  </div>
                ) : chatMessages.length > 0 ? (
                  chatMessages.map((msg, idx) => {
                    const isSelf = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col max-w-[80%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        {/* Name label if not self */}
                        {!isSelf && (
                          <span className="text-[9px] font-bold text-slate-500 mb-1 ml-1">{msg.senderName}</span>
                        )}
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isSelf
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-900 text-slate-300 border border-slate-950 rounded-tl-none'
                          }`}>
                          <p>{msg.content}</p>
                        </div>
                        <span className="text-[7px] text-slate-600 mt-1 px-1">
                          {formatChatTime(msg.createdAt || msg.sentAt)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                    <MessagesSquare size={24} className="text-slate-500 mb-2" />
                    <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Start the chat</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Instant message input */}
              <form onSubmit={handleSendChatMessage} className="mt-4 shrink-0 relative">
                <input
                  type="text"
                  disabled={!chatConnected}
                  placeholder={chatConnected ? "Type an instant message..." : "Connecting to chat room..."}
                  className="w-full pl-4 pr-10 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition disabled:opacity-40"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!chatConnected || !chatInput.trim()}
                  className="absolute right-2 top-2 p-1 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition rounded-lg"
                >
                  <Send size={12} />
                </button>
              </form>

            </div>
          )}

          {/* TAB 3: FILES / ATTACHMENTS */}
          {activeTab === 'files' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-955 my-2">
                {attachmentsLoading && attachments.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-20">
                    <Loader2 size={18} className="animate-spin text-slate-505" />
                  </div>
                ) : attachments.length > 0 ? (
                  attachments.map((file) => {
                    const canDeleteFile = user?.email === file.uploadedBy || user?.role === 'ROLE_ADMIN';
                    return (
                      <div key={file.id} className="bg-slate-900/40 border border-slate-900 p-3 rounded-xl flex items-center justify-between group relative">
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <div className="text-slate-400 p-2 bg-slate-950 rounded-lg shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-300 truncate pr-4">{file.originalFileName}</p>
                            <div className="flex items-center space-x-1.5 mt-1 text-[9px] text-slate-500 font-medium">
                              <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <div className="w-3.5 h-3.5 bg-indigo-650/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[7px] font-bold rounded-full shrink-0">
                                {getInitials(getUploaderName(file))}
                              </div>
                              <span className="truncate max-w-[100px]" title={getUploaderName(file)}>
                                {getUploaderName(file)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDownloadAttachment(file.fileName, file.originalFileName, file.downloadUrl)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg transition"
                            title="Download File"
                          >
                            <Download size={14} />
                          </button>
                          {canDeleteFile && (
                            <button
                              onClick={() => handleDeleteAttachment(file.id)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg transition opacity-0 group-hover:opacity-100"
                              title="Delete File"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                    <Paperclip size={24} className="text-slate-500 mb-2" />
                    <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">No attachments yet</span>
                  </div>
                )}
              </div>

              <div className="mt-4 shrink-0">
                <label className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-950 border border-slate-850 hover:bg-slate-850 border-dashed rounded-xl cursor-pointer text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading file...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload New File</span>
                    </>
                  )}
                  <input
                    type="file"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default TaskDetailsModal;
