import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Clock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { SwapRequestModal } from "./SwapRequestModal";

export function MarketplaceView() {
  const swappableSlots = useQuery(api.events.getSwappableSlots);
  const userEvents = useQuery(api.events.getUserEvents);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const userSwappableSlots = userEvents?.filter(event => event.status === "SWAPPABLE") || [];

  if (!swappableSlots) {
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
          <Clock className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Marketplace</h2>
        </div>
        <p className="text-gray-600 mt-2">Browse and request swaps with other users' available slots</p>
      </div>

      <div className="p-6">
        {swappableSlots.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No swappable slots available</h3>
            <p className="text-gray-600">Check back later for new opportunities to swap time slots</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {swappableSlots.map((slot) => {
              const startDateTime = formatDateTime(slot.startTime);
              const endDateTime = formatDateTime(slot.endTime);
              
              return (
                <div
                  key={slot._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-purple-300"
                >
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-1">{slot.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{slot.ownerName}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">{startDateTime.date}</div>
                      <div>{startDateTime.time} - {endDateTime.time}</div>
                    </div>
                    
                    {slot.description && (
                      <p className="text-sm text-gray-600">{slot.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedSlot(slot)}
                    disabled={userSwappableSlots.length === 0}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={userSwappableSlots.length === 0 ? "You need swappable slots to request a swap" : ""}
                  >
                    <span>Request Swap</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {userSwappableSlots.length === 0 && swappableSlots.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Tip:</strong> You need to have swappable slots in your calendar to request swaps. 
              Mark some of your events as "swappable" first.
            </p>
          </div>
        )}
      </div>

      {selectedSlot && (
        <SwapRequestModal
          targetSlot={selectedSlot}
          userSlots={userSwappableSlots}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
