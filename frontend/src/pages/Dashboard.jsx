import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FolderKanban, 
  CheckSquare, 
  TrendingUp, 
  Activity, 
  ShieldAlert,
  Loader2,
  ListTodo,
  History,
  FileText
} from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if current user is Admin or PM
  const isAdminOrPM = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_PROJECT_MANAGER';

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        if (isAdminOrPM) {
          const [statsRes, logsRes] = await Promise.all([
            api.get('/api/dashboard/stats'),
            api.get('/api/activities')
          ]);
          setStats(statsRes.data);
          setActivities(logsRes.data || []);
        } else {
          // Member only fetches activity logs
          const logsRes = await api.get('/api/activities');
          setActivities(logsRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load workspace activity logs.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, isAdminOrPM]);

  // Format activity action key labels into human-friendly strings
  const formatAction = (action) => {
    return action
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
        <span className="text-sm font-medium">Gathering workspace analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {error && (
        <div className="flex items-center space-x-2 bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-rose-400 text-xs">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* MEMBER VIEW - Banner & Shortcuts */}
      {!isAdminOrPM && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900/60 to-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white mb-2">Welcome back, {user?.name}!</h2>
              <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                Have a productive day! Check your tasks board to update statuses, join project discussion chats, or view your notifications for recent mentions.
              </p>
            </div>
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-850 transition">
              <div>
                <div className="text-indigo-400 mb-4 bg-indigo-500/10 p-2.5 rounded-lg w-fit"><ListTodo size={24} /></div>
                <h3 className="font-bold text-slate-100 text-base mb-1">My Assigned Tasks</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review, filter, and modify tasks assigned to you. Move task status indicators through columns on the Kanban board.
                </p>
              </div>
              <Link to="/tasks" className="mt-6 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition w-fit">
                Go to Tasks Board &rarr;
              </Link>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-850 transition">
              <div>
                <div className="text-violet-400 mb-4 bg-violet-500/10 p-2.5 rounded-lg w-fit"><FolderKanban size={24} /></div>
                <h3 className="font-bold text-slate-100 text-base mb-1">Shared Projects</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Check active projects workspace list, track audit activity logs, and chat live in project discussion rooms.
                </p>
              </div>
              <Link to="/projects" className="mt-6 text-xs text-violet-400 hover:text-violet-300 font-semibold transition w-fit">
                View Projects Directory &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN & PM VIEW - Stats Metrics */}
      {isAdminOrPM && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Projects</span>
                <h3 className="text-2xl font-black text-white mt-1">{stats?.totalProjects || 0}</h3>
              </div>
              <div className="bg-indigo-600/10 text-indigo-400 p-3 rounded-xl border border-indigo-500/10">
                <FolderKanban size={20} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Tasks</span>
                <h3 className="text-2xl font-black text-white mt-1">{stats?.totalTasks || 0}</h3>
              </div>
              <div className="bg-violet-600/10 text-violet-400 p-3 rounded-xl border border-violet-500/10">
                <CheckSquare size={20} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Task Completion</span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {stats?.taskCompletionRate ? `${stats.taskCompletionRate.toFixed(1)}%` : '0%'}
                </h3>
              </div>
              <div className="bg-emerald-600/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/10">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">System Status</span>
                <h3 className="text-sm font-extrabold text-emerald-400 mt-2 flex items-center space-x-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>Fully Operational</span>
                </h3>
              </div>
              <div className="bg-slate-950 text-slate-500 p-3 rounded-xl border border-slate-800">
                <Activity size={20} />
              </div>
            </div>
          </div>

          {/* Grid Layouts for distribution charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-200 mb-4 border-b border-slate-900 pb-3">Tasks By Status</h3>
              {stats?.taskByStatus && Object.keys(stats.taskByStatus).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.taskByStatus).map(([status, count]) => {
                    const percentage = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
                    return (
                      <div key={status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400 capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                          <span className="text-slate-200">{count} tasks ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-slate-600 block text-center py-6">No tasks logged in database yet.</span>
              )}
            </div>

            <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-200 mb-4 border-b border-slate-900 pb-3">Tasks By Priority</h3>
              {stats?.taskByPriority && Object.keys(stats.taskByPriority).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.taskByPriority).map(([priority, count]) => {
                    const percentage = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
                    
                    const getPriorityColor = (p) => {
                      switch (p) {
                        case 'CRITICAL': return 'bg-rose-500';
                        case 'HIGH': return 'bg-orange-500';
                        case 'MEDIUM': return 'bg-yellow-500';
                        default: return 'bg-slate-500';
                      }
                    };

                    return (
                      <div key={priority} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400 capitalize">{priority.toLowerCase()}</span>
                          <span className="text-slate-200">{count} tasks ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getPriorityColor(priority)}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-slate-600 block text-center py-6">No tasks logged in database yet.</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* CENTRAL ACTIVITY LOGS AUDIT TRAIL */}
      <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl">
        <h3 className="font-bold text-sm text-slate-200 mb-4 border-b border-slate-900 pb-3 flex items-center space-x-2">
          <History size={16} className="text-indigo-400" />
          <span>Recent Workspace Activities</span>
        </h3>

        {activities.length > 0 ? (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.slice(0, 10).map((log, idx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {idx !== activities.slice(0, 10).length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-900" aria-hidden="true"></span>
                    )}
                    <div className="relative flex space-x-3.5">
                      <div>
                        <span className="h-8.5 w-8.5 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-[10px] font-black text-indigo-400">
                          {getInitials(log.userName)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-slate-400">
                            <span className="font-bold text-slate-200">{log.userName}</span>{' '}
                            performed{' '}
                            <span className="text-indigo-400 font-semibold">{formatAction(log.action)}</span>{' '}
                            on {log.entityType.toLowerCase()}{' '}
                            <span className="text-slate-300 font-medium">#{log.entityId}</span>
                          </p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-10 opacity-30 flex flex-col items-center">
            <FileText size={32} className="text-slate-500 mb-2" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">No activity logged yet</span>
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;
