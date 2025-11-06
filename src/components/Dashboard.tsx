import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Calendar, Clock, Users, Bell, Plus, LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { CalendarView } from "./CalendarView";
import { MarketplaceView } from "./MarketplaceView";
import { NotificationsView } from "./NotificationsView";
import { CreateEventModal } from "./CreateEventModal";

type View = 'calendar' | 'marketplace' | 'notifications';

export function Dashboard() {
  const { signOut } = useAuthActions();
  const [currentView, setCurrentView] = useState<View>('calendar');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const user = useQuery(api.auth.loggedInUser);
  const incomingRequests = useQuery(api.swaps.getIncomingRequests);

  const pendingCount = incomingRequests?.filter(req => req.status === 'PENDING').length || 0;

  const navigation = [
    { id: 'calendar', label: 'My Calendar', icon: Calendar },
    { id: 'marketplace', label: 'Marketplace', icon: Clock },
    { id: 'notifications', label: 'Requests', icon: Bell, badge: pendingCount },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarView />;
      case 'marketplace':
        return <MarketplaceView />;
      case 'notifications':
        return <NotificationsView />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SlotSwapper
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Event</span>
              </button>
              
              <div className="flex items-center space-x-2 text-gray-700">
                <Users className="w-4 h-4" />
                <span className="text-sm">Welcome, {user?.name || user?.email}</span>
              </div>
              
              <button
                onClick={() => signOut()}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as View)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderView()}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateEventModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
