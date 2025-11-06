import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Calendar, Clock, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function CalendarView() {
  const events = useQuery(api.events.getUserEvents);
  const updateEventStatus = useMutation(api.events.updateEventStatus);
  const deleteEvent = useMutation(api.events.deleteEvent);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  const handleStatusToggle = async (eventId: string, currentStatus: string) => {
    if (currentStatus === "SWAP_PENDING") {
      toast.error("Cannot modify event with pending swap");
      return;
    }

    setLoadingEventId(eventId);
    try {
      const newStatus = currentStatus === "BUSY" ? "SWAPPABLE" : "BUSY";
      await updateEventStatus({ eventId: eventId as any, status: newStatus as any });
      toast.success(`Event marked as ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error("Failed to update event status");
    } finally {
      setLoadingEventId(null);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await deleteEvent({ eventId: eventId as any });
      toast.success("Event deleted successfully");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BUSY':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'SWAPPABLE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SWAP_PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!events) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">My Calendar</h2>
        </div>
        <p className="text-gray-600 mt-2">Manage your events and mark them as swappable</p>
      </div>

      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">Create your first event to get started with SlotSwapper</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events
              .sort((a, b) => a.startTime - b.startTime)
              .map((event) => {
                const startDateTime = formatDateTime(event.startTime);
                const endDateTime = formatDateTime(event.endTime);
                
                return (
                  <div
                    key={event._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(event.status)}`}>
                            {event.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{startDateTime.date}</span>
                          </div>
                          <span>{startDateTime.time} - {endDateTime.time}</span>
                        </div>
                        
                        {event.description && (
                          <p className="text-gray-600 text-sm">{event.description}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {event.status !== "SWAP_PENDING" && (
                          <button
                            onClick={() => handleStatusToggle(event._id, event.status)}
                            disabled={loadingEventId === event._id}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                              event.status === "SWAPPABLE"
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            } disabled:opacity-50`}
                          >
                            {loadingEventId === event._id ? "..." : 
                             event.status === "SWAPPABLE" ? "Make Busy" : "Make Swappable"}
                          </button>
                        )}
                        
                        {event.status !== "SWAP_PENDING" && (
                          <button
                            onClick={() => handleDelete(event._id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
