import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/Adminauthcontext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  Vote,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { name: 'Candidates', to: '/admin/candidates', icon: Users },
  { name: 'Voters', to: '/admin/voters', icon: UserCheck },
  { name: 'Live Results', to: '/admin/results', icon: BarChart3 },
  { name: 'Audit Logs', to: '/admin/audit', icon: FileText },
  { name: 'Settings', to: '/admin/settings', icon: SettingsIcon },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Vote className="w-8 h-8 text-secondary" />
              <div>
                <h1 className="text-xl font-display font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-600">Election Management System</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-secondary transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}